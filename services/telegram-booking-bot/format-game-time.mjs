const BOOKING_TIMEZONE = "Asia/Krasnoyarsk";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: BOOKING_TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: BOOKING_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * @param {string | Date} startsAt
 * @param {string | Date | null | undefined} [endsAt]
 */
export function formatGameStartLabel(startsAt, endsAt) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return undefined;

  const datePart = dateFormatter.format(start);
  const startTime = timeFormatter.format(start).replace(/^24:/, "00:");

  if (endsAt) {
    const end = new Date(endsAt);
    if (!Number.isNaN(end.getTime())) {
      const endTime = timeFormatter.format(end).replace(/^24:/, "00:");
      return `${datePart}, ${startTime}–${endTime}`;
    }
  }

  return `${datePart}, ${startTime}`;
}
