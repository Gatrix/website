/** Сегменты формата игры */
export type Tier = "tavern" | "royal";

/** Цена за 1 час с человека (₽) */
export const PRICE_PER_HOUR: Record<Tier, number> = {
  tavern: 300,
  royal: 500,
};

/** Стандартная длительность игры в часах (для расчёта суммы по умолчанию) */
export const STANDARD_HOURS = 4;

export function getPricePerPlayer(tier: Tier, durationMinutes?: number): number {
  const hours = durationMinutes ? durationMinutes / 60 : STANDARD_HOURS;
  return Math.round(PRICE_PER_HOUR[tier] * hours);
}

export function calculateTotalPrice(
  tier: Tier,
  players: number,
  durationMinutes?: number
): number {
  return getPricePerPlayer(tier, durationMinutes) * players;
}
