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
  const preferred = config.defaultAdventureType ?? "adventure";
  const adventureType = config.formats.some((f) => f.id === preferred)
    ? preferred
    : (config.formats[0]?.id ?? "adventure");
  const defaultUni = config.defaultUniverseId;
  const universeId =
    config.universes.length === 0
      ? null
      : defaultUni && config.universes.some((u) => u.id === defaultUni)
        ? defaultUni
        : (config.universes[0]?.id ?? null);
  return {
    gameSystemId: config.systems[0]?.id ?? null,
    difficultyId: config.difficulties[0]?.id ?? null,
    universeId,
    playerCount: Math.min(b.maxPlayers, Math.max(b.minPlayers, midPc)),
    durationHours: Math.min(b.maxDurationHours, Math.max(b.minDurationHours, midDh)),
    adventureType,
  };
}
