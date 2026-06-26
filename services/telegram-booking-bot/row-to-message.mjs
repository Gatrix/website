import { formatGameStartLabel } from "./format-game-time.mjs";

/**
 * @param {Record<string, unknown>} row — строка из booking_requests
 */
export function rowToBookingBody(row) {
  const startsAtRaw = row.starts_at;
  const endsAtRaw = row.ends_at;

  return {
    adventureId: row.adventure_id,
    adventureTitle: row.adventure_title,
    gameSystemName: row.game_system_name,
    difficultyName: row.difficulty_name,
    universeName: row.universe_name,
    playerCount: row.player_count,
    durationHours: row.duration_hours,
    startsAt:
      startsAtRaw != null
        ? formatGameStartLabel(
            /** @type {string | Date} */ (startsAtRaw),
            endsAtRaw != null ? /** @type {string | Date} */ (endsAtRaw) : undefined
          )
        : undefined,
    adventureType: row.adventure_type,
    playerNote: row.player_note,
    phone: row.phone,
    warnings: row.warning_messages,
    requestId: row.id,
    createdAt: row.created_at
      ? new Date(/** @type {string | Date} */ (row.created_at)).toLocaleString("ru-RU", {
          timeZone: "Europe/Moscow",
        })
      : undefined,
  };
}
