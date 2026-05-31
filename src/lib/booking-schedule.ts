/** Часовой пояс клуба (Красноярск, UTC+7 без перехода на летнее время). */
export const BOOKING_TIMEZONE = "Asia/Krasnoyarsk";

/** Игровой день: с 10:00 до 02:00 следующего календарного дня (16 ч). */
export const GAME_DAY_OPEN_HOUR = 10;
export const GAME_DAY_CLOSE_HOUR = 2;
export const GAME_DAY_HOURS = 16;

/** Сегодня + завтра (календарные дни в Krasnoyarsk) закрыты для записи. */
export const BOOKING_MIN_LEAD_CALENDAR_DAYS = 2;

export type BusyInterval = {
  startsAt: Date;
  endsAt: Date;
  status: string;
};

export type AvailableSlot = {
  gameDate: string;
  startTime: string;
  startsAt: string;
  endsAt: string;
};

export type AvailabilityDay = {
  date: string;
  slots: AvailableSlot[];
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD + HH:MM → Date (Krasnoyarsk). */
export function parseGameInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

export function addCalendarDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const nd = new Date(utc);
  return `${nd.getUTCFullYear()}-${pad2(nd.getUTCMonth() + 1)}-${pad2(nd.getUTCDate())}`;
}

export function getZonedParts(d: Date, timeZone = BOOKING_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute: Number(get("minute")),
  };
}

export function todayGameDate(now = new Date()): string {
  const { date, hour } = getZonedParts(now);
  if (hour < GAME_DAY_OPEN_HOUR) return addCalendarDays(date, -1);
  return date;
}

/** Календарная дата «сегодня» в Krasnoyarsk. */
export function calendarToday(now = new Date()): string {
  return getZonedParts(now).date;
}

/** Первый день в календаре, доступный для записи (после сегодня и завтра). */
export function minBookableCalendarDate(now = new Date()): string {
  return addCalendarDays(calendarToday(now), BOOKING_MIN_LEAD_CALENDAR_DAYS);
}

export function isCalendarDateBookable(dateStr: string, now = new Date()): boolean {
  return dateStr >= minBookableCalendarDate(now);
}

/** Игровой день, к которому относится момент начала. */
export function gameDateForInstant(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const { date, hour } = getZonedParts(d);
  if (hour < GAME_DAY_OPEN_HOUR) return addCalendarDays(date, -1);
  return date;
}

export function formatTimeLabel(d: Date): string {
  const { hour, minute } = getZonedParts(d);
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function formatSlotRangeLabel(startsAt: Date, endsAt: Date): string {
  return `${formatTimeLabel(startsAt)}–${formatTimeLabel(endsAt)}`;
}

export function gameDayWindow(gameDate: string): { start: Date; end: Date } {
  return {
    start: parseGameInstant(gameDate, `${pad2(GAME_DAY_OPEN_HOUR)}:00`),
    end: parseGameInstant(addCalendarDays(gameDate, 1), `${pad2(GAME_DAY_CLOSE_HOUR)}:00`),
  };
}

export function endsAtFromStart(startsAt: Date, durationHours: number): Date {
  return new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isIntervalWithinGameDay(
  startsAt: Date,
  endsAt: Date,
  gameDate: string
): boolean {
  const { start, end } = gameDayWindow(gameDate);
  return startsAt >= start && endsAt <= end;
}

/** Все допустимые старты в игровой день для заданной длительности (шаг 1 ч). */
export function listCandidateStarts(gameDate: string, durationHours: number): Date[] {
  const maxOffset = GAME_DAY_HOURS - durationHours;
  if (maxOffset < 0) return [];

  const windowStart = gameDayWindow(gameDate).start;
  const result: Date[] = [];
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    result.push(new Date(windowStart.getTime() + offset * 60 * 60 * 1000));
  }
  return result;
}

export function isSlotAvailable(
  startsAt: Date,
  durationHours: number,
  busy: BusyInterval[],
  now = new Date()
): boolean {
  if (startsAt.getTime() <= now.getTime()) return false;

  const endsAt = endsAtFromStart(startsAt, durationHours);
  const gameDate = gameDateForInstant(startsAt);
  if (!isCalendarDateBookable(gameDate, now)) return false;
  if (!isIntervalWithinGameDay(startsAt, endsAt, gameDate)) return false;

  return !busy.some(
    (b) =>
      b.status !== "cancelled" &&
      intervalsOverlap(startsAt, endsAt, b.startsAt, b.endsAt)
  );
}

export function computeAvailability(
  fromDate: string,
  toDate: string,
  durationHours: number,
  busy: BusyInterval[],
  now = new Date()
): AvailabilityDay[] {
  const days: AvailabilityDay[] = [];
  let cursor = fromDate;

  while (cursor <= toDate) {
    const slots: AvailableSlot[] = [];

    if (isCalendarDateBookable(cursor, now)) {
      for (const startsAt of listCandidateStarts(cursor, durationHours)) {
        if (!isSlotAvailable(startsAt, durationHours, busy, now)) continue;
        const endsAt = endsAtFromStart(startsAt, durationHours);
        slots.push({
          gameDate: cursor,
          startTime: formatTimeLabel(startsAt),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        });
      }
    }

    days.push({ date: cursor, slots });
    cursor = addCalendarDays(cursor, 1);
  }

  return days;
}

export function validateBookingInstant(
  startsAtIso: string,
  durationHours: number,
  busy: BusyInterval[],
  now = new Date()
): { ok: true; startsAt: Date; endsAt: Date } | { ok: false; error: string } {
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Некорректное время начала" };
  }

  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return { ok: false, error: "Некорректная длительность" };
  }

  const endsAt = endsAtFromStart(startsAt, durationHours);
  const gameDate = gameDateForInstant(startsAt);

  if (!isCalendarDateBookable(gameDate, now)) {
    return {
      ok: false,
      error: "Запись на сегодня и завтра недоступна. Выберите более позднюю дату.",
    };
  }

  if (!isIntervalWithinGameDay(startsAt, endsAt, gameDate)) {
    return {
      ok: false,
      error: "Выбранное время не помещается в рабочие часы (10:00–02:00)",
    };
  }

  if (!isSlotAvailable(startsAt, durationHours, busy, now)) {
    return { ok: false, error: "Это время уже занято. Выберите другой слот." };
  }

  return { ok: true, startsAt, endsAt };
}

export function monthBounds(year: number, monthIndex: number): { from: string; to: string } {
  const from = `${year}-${pad2(monthIndex + 1)}-01`;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;
  return { from, to };
}

export function parseIsoDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return value;
}
