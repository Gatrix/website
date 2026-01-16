export type Tier = "standard" | "premium";

export const PRICING = {
  standard: 1800,
  premium: 2600,
};

export function getPricePerPlayer(tier: Tier) {
  return PRICING[tier] ?? 0;
}

export function calculateTotalPrice(tier: Tier, players: number) {
  return getPricePerPlayer(tier) * players;
}
