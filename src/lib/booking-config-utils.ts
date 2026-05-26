import type { Adventure } from "@/lib/db";
import type { BookingConfigPayload, GameFormatId } from "@/lib/booking-types";

export function defaultFormatFromAdventure(a: Adventure): GameFormatId {
  const raw = (a.adventure_type ?? a.format ?? "").toLowerCase();
  if (raw.includes("ваншот") || raw === "oneshot") return "oneshot";
  if (raw.includes("кампан") || raw === "campaign") return "campaign";
  if (raw.includes("приключ") || raw === "adventure") return "adventure";
  return "adventure";
}

/** Начальные значения полей формы по загруженному конфигу. */
export function getBookingInitialValues(config: BookingConfigPayload) {
  const b = config.bounds;
  const midPc = Math.round((b.minPlayers + b.maxPlayers) / 2);
  const midDh = Math.round((b.minDurationHours + b.maxDurationHours) / 2);
  const enabledFormats = config.formats.filter((f) => f.enabled !== false);
  const preferred = config.defaultAdventureType ?? "adventure";
  const adventureType = enabledFormats.some((f) => f.id === preferred)
    ? preferred
    : (enabledFormats[0]?.id ?? "adventure");
  return {
    gameSystemId: config.systems[0]?.id ?? null,
    difficultyId: config.difficulties[0]?.id ?? null,
    playerCount: Math.min(b.maxPlayers, Math.max(b.minPlayers, midPc)),
    durationHours: Math.min(b.maxDurationHours, Math.max(b.minDurationHours, midDh)),
    adventureType,
  };
}
