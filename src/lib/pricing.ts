/** Сегменты формата игры */
export type Tier = "city_square" | "tavern" | "royal";

/** Цена за 1 час с человека (₽) */
export const PRICE_PER_HOUR: Record<Tier, number> = {
  city_square: 300,
  tavern: 500,
  royal: 700,
};

/** Стандартная длительность игры в часах (для отображения на карточках) */
export const STANDARD_HOURS = 6;

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
