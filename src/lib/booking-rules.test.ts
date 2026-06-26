import { describe, expect, it } from "vitest";
import { collectActiveWarnings, ruleMatches } from "@/lib/booking-rules";
import type { BookingSelectionState, WarningRule } from "@/lib/booking-types";

const baseState: BookingSelectionState = {
  gameSystemId: "dnd5e",
  difficultyId: "narrative",
  universeId: "forgotten-realms",
  playerCount: 5,
  durationHours: 5,
  adventureType: "adventure",
};

describe("booking-rules", () => {
  it("ruleMatches requires all match keys", () => {
    expect(
      ruleMatches(
        { playerCount: 5, durationHours: 5 },
        baseState,
        "adv-1",
        null
      )
    ).toBe(true);

    expect(
      ruleMatches({ playerCount: 4 }, baseState, "adv-1", null)
    ).toBe(false);
  });

  it("ruleMatches scopes by adventure id when set", () => {
    expect(
      ruleMatches({ playerCount: 5 }, baseState, "adv-1", "adv-2")
    ).toBe(false);
  });

  it("collectActiveWarnings returns matching warning ids", () => {
    const rules: WarningRule[] = [
      {
        ruleId: 1,
        warningId: 10,
        adventureId: null,
        match: { minPlayers: 6 },
      },
      {
        ruleId: 2,
        warningId: 20,
        adventureId: null,
        match: { adventureType: "campaign" },
      },
    ];

    expect(collectActiveWarnings("adv-1", rules, baseState)).toEqual([]);

    const largeParty = { ...baseState, playerCount: 6 };
    expect(collectActiveWarnings("adv-1", rules, largeParty)).toEqual([10]);
  });
});
