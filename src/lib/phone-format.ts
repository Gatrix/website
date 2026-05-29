/** Цифры российского мобильного: 7 + 10 цифр (9XXXXXXXXX). */
export function normalizeRuPhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("9")) {
    digits = "7" + digits;
  } else if (digits.length > 0 && digits[0] !== "7") {
    digits = "7" + digits;
  }
  return digits.slice(0, 11);
}

/** Маска ввода: +7 (999) 123-45-67 */
export function formatRuPhoneAsYouType(raw: string): { display: string; digits: string } {
  const digits = normalizeRuPhoneDigits(raw);
  if (digits.length === 0) {
    return { display: "", digits: "" };
  }

  const local = digits.slice(1);
  let display = "+7";

  if (local.length > 0) {
    display += " (" + local.slice(0, 3);
    if (local.length >= 3) display += ")";
  }
  if (local.length > 3) {
    display += " " + local.slice(3, 6);
  }
  if (local.length > 6) {
    display += "-" + local.slice(6, 8);
  }
  if (local.length > 8) {
    display += "-" + local.slice(8, 10);
  }

  return { display, digits };
}

export function isCompleteRuPhone(digits: string): boolean {
  return /^7\d{10}$/.test(digits);
}

/** Для БД и Telegram: +79991234567 */
export function toE164RuPhone(digits: string): string {
  return `+${digits}`;
}

export function formatStoredRuPhone(stored: string): string {
  const digits = normalizeRuPhoneDigits(stored);
  if (!isCompleteRuPhone(digits)) return stored.trim();
  return formatRuPhoneAsYouType(digits).display;
}
