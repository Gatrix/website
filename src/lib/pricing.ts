export type Tier = "standard" | "premium";

export const PRICING = {
  standard: 1000,
  premium: 1000,
};

export function getPricePerPlayer(tier: Tier) {
  return PRICING[tier] ?? 0;
}

export function calculateTotalPrice(tier: Tier, players: number) {
  return getPricePerPlayer(tier) * players;
}
