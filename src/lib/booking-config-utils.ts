import type { Adventure } from "@/lib/db";
import type { BookingConfigPayload, BookingUniverse, GameFormatId } from "@/lib/booking-types";

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
  const allowedPlayers = [4, 5, 6];
  const allowedHours = [4, 5, 6, 7];
  const midPc = Math.round((b.minPlayers + b.maxPlayers) / 2);
  const midDh = Math.round((b.minDurationHours + b.maxDurationHours) / 2);
  const snap = (value: number, list: number[]) =>
    list.reduce((best, n) => (Math.abs(n - value) < Math.abs(best - value) ? n : best));
  const preferred = config.defaultAdventureType ?? "adventure";
  const selectableFormats = config.formats.filter((f) => f.available);
  const adventureType = selectableFormats.some((f) => f.id === preferred)
    ? preferred
    : (selectableFormats[0]?.id ?? "adventure");
  return {
    gameSystemId: config.systems[0]?.id ?? null,
    difficultyId: config.difficulties[0]?.id ?? null,
    universeId: config.universe?.id ?? null,
    playerCount: snap(Math.min(b.maxPlayers, Math.max(b.minPlayers, midPc)), allowedPlayers),
    durationHours: snap(Math.min(b.maxDurationHours, Math.max(b.minDurationHours, midDh)), allowedHours),
    adventureType,
  };
}

export function bookingUniverseFromConfig(config: BookingConfigPayload): BookingUniverse | null {
  return config.universe;
}
