import { describe, expect, it } from "vitest";
import {
  formatRuPhoneAsYouType,
  formatStoredRuPhone,
  isCompleteRuPhone,
  normalizeRuPhoneDigits,
  toE164RuPhone,
} from "@/lib/phone-format";

describe("phone-format", () => {
  it("normalizes 8-prefix and 10-digit mobile to 7XXXXXXXXXX", () => {
    expect(normalizeRuPhoneDigits("8 (999) 123-45-67")).toBe("79991234567");
    expect(normalizeRuPhoneDigits("9991234567")).toBe("79991234567");
  });

  it("formats as-you-type display mask", () => {
    expect(formatRuPhoneAsYouType("9991234567").display).toBe("+7 (999) 123-45-67");
  });

  it("validates complete RU phone", () => {
    expect(isCompleteRuPhone("79991234567")).toBe(true);
    expect(isCompleteRuPhone("7999123456")).toBe(false);
  });

  it("exports E.164", () => {
    expect(toE164RuPhone("79991234567")).toBe("+79991234567");
  });

  it("formats stored phone for display", () => {
    expect(formatStoredRuPhone("+79991234567")).toBe("+7 (999) 123-45-67");
  });
});
