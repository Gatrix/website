import { describe, expect, it } from "vitest";
import {
  endsAtFromStart,
  gameDayWindow,
  isIntervalWithinGameDay,
  listCandidateStarts,
  parseGameInstant,
  validateBookingInstant,
} from "@/lib/booking-schedule";

describe("booking-schedule", () => {
  const farFuture = new Date("2030-06-15T12:00:00+07:00");

  it("builds game day window 10:00–02:00 next day", () => {
    const { start, end } = gameDayWindow("2030-06-15");
    expect(start).toEqual(parseGameInstant("2030-06-15", "10:00"));
    expect(end).toEqual(parseGameInstant("2030-06-16", "02:00"));
  });

  it("lists hourly candidate starts for duration", () => {
    const starts = listCandidateStarts("2030-06-15", 5);
    expect(starts.length).toBe(12);
    expect(starts[0]).toEqual(parseGameInstant("2030-06-15", "10:00"));
    expect(starts.at(-1)).toEqual(parseGameInstant("2030-06-15", "21:00"));
  });

  it("rejects slot outside game day", () => {
    const startsAt = parseGameInstant("2030-06-15", "09:00");
    const endsAt = endsAtFromStart(startsAt, 4);
    expect(isIntervalWithinGameDay(startsAt, endsAt, "2030-06-15")).toBe(false);
  });

  it("validateBookingInstant accepts free slot in the future", () => {
    const startsAt = parseGameInstant("2030-06-20", "14:00");
    const result = validateBookingInstant(startsAt.toISOString(), 4, [], farFuture);
    expect(result.ok).toBe(true);
  });

  it("validateBookingInstant rejects occupied slot", () => {
    const startsAt = parseGameInstant("2030-06-20", "14:00");
    const endsAt = endsAtFromStart(startsAt, 4);
    const result = validateBookingInstant(
      startsAt.toISOString(),
      4,
      [{ startsAt, endsAt, status: "confirmed" }],
      farFuture
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("занято");
    }
  });
});
