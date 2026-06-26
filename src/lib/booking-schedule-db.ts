import { getDbPool } from "@/lib/pg-pool";
import type { AvailabilityDay, BusyInterval } from "@/lib/booking-schedule";
import {
  BOOKING_TIMEZONE,
  computeAvailability,
  minBookableCalendarDate,
  parseIsoDate,
} from "@/lib/booking-schedule";

function isMissingRelationError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "42P01" || code === "42703";
}

export async function fetchBusyIntervals(fromDate: string, toDate: string): Promise<BusyInterval[]> {
  const pool = getDbPool();
  const fromInstant = `${fromDate}T00:00:00+07:00`;
  const toInstant = `${toDate}T23:59:59+07:00`;

  const { rows } = await pool.query<{
    starts_at: Date;
    ends_at: Date;
    status: string;
  }>(
    `
    SELECT starts_at, ends_at, status
    FROM booking_schedule
    WHERE status <> 'cancelled'
      AND starts_at < ($2::timestamptz + INTERVAL '1 day')
      AND ends_at > $1::timestamptz
    ORDER BY starts_at ASC
    `,
    [fromInstant, toInstant]
  );

  return rows.map((r) => ({
    startsAt: new Date(r.starts_at),
    endsAt: new Date(r.ends_at),
    status: r.status,
  }));
}

export async function getScheduleAvailability(params: {
  from: string;
  to: string;
  durationHours: number;
}): Promise<{ timezone: string; durationHours: number; days: AvailabilityDay[] } | null> {
  const from = parseIsoDate(params.from);
  const to = parseIsoDate(params.to);
  if (!from || !to || from > to) return null;
  if (!Number.isFinite(params.durationHours) || params.durationHours <= 0) return null;

  try {
    const busy = await fetchBusyIntervals(from, to);
    const days = computeAvailability(from, to, params.durationHours, busy);
    return {
      timezone: BOOKING_TIMEZONE,
      durationHours: params.durationHours,
      days,
    };
  } catch (err) {
    if (isMissingRelationError(err)) return null;
    throw err;
  }
}

export async function fetchBusyIntervalsForValidation(
  startsAt: Date,
  endsAt: Date
): Promise<BusyInterval[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    starts_at: Date;
    ends_at: Date;
    status: string;
  }>(
    `
    SELECT starts_at, ends_at, status
    FROM booking_schedule
    WHERE status <> 'cancelled'
      AND starts_at < $2::timestamptz
      AND ends_at > $1::timestamptz
    `,
    [startsAt.toISOString(), endsAt.toISOString()]
  );

  return rows.map((r) => ({
    startsAt: new Date(r.starts_at),
    endsAt: new Date(r.ends_at),
    status: r.status,
  }));
}

/** Минимальная дата для бронирования (после «сегодня» и «завтра»). */
export function minBookableGameDate(): string {
  return minBookableCalendarDate();
}

/** Проверяет наличие таблицы booking_schedule (результат кэшируется на процесс). */
let scheduleTableCheck: Promise<boolean> | null = null;

export async function isScheduleTableAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  if (!scheduleTableCheck) {
    scheduleTableCheck = (async () => {
      try {
        const pool = getDbPool();
        const { rows } = await pool.query<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'booking_schedule'
          ) AS exists`
        );
        return rows[0]?.exists === true;
      } catch {
        return false;
      }
    })();
  }
  return scheduleTableCheck;
}
