import type { BookingSelectionState, GameFormatId, WarningRule } from "@/lib/booking-types";

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Все ключи в match должны совпасть с состоянием (логика И). */
export function ruleMatches(
  match: Record<string, unknown>,
  state: BookingSelectionState,
  adventureId: string,
  ruleAdventureId: string | null
): boolean {
  if (ruleAdventureId != null && ruleAdventureId !== adventureId) return false;

  const at = match.adventureType;
  if (at != null && String(at) !== state.adventureType) return false;

  const dh = num(match.durationHours);
  if (dh !== undefined && Math.abs(dh - state.durationHours) > 1e-6) return false;

  const minDh = num(match.minDurationHours);
  const maxDh = num(match.maxDurationHours);
  if (minDh !== undefined && state.durationHours < minDh - 1e-6) return false;
  if (maxDh !== undefined && state.durationHours > maxDh + 1e-6) return false;

  const pc = num(match.playerCount);
  if (pc !== undefined && pc !== state.playerCount) return false;

  const minPc = num(match.minPlayers);
  const maxPc = num(match.maxPlayers);
  if (minPc !== undefined && state.playerCount < minPc) return false;
  if (maxPc !== undefined && state.playerCount > maxPc) return false;

  const sys = num(match.gameSystemId);
  if (sys !== undefined && state.gameSystemId !== sys) return false;

  return true;
}

export function collectActiveWarnings(
  adventureId: string,
  rules: WarningRule[],
  state: BookingSelectionState
): number[] {
  const ids = new Set<number>();
  for (const r of rules) {
    if (ruleMatches(r.match, state, adventureId, r.adventureId)) {
      ids.add(r.warningId);
    }
  }
  return [...ids];
}

export function isGameFormatId(v: string): v is GameFormatId {
  return v === "oneshot" || v === "adventure" || v === "campaign";
}
