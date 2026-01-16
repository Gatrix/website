export type TagVariant =
  | "discount"
  | "season"
  | "hit"
  | "new"
  | "beginner"
  | "default";

const normalizeTag = (tag: string) => tag.trim().toLowerCase();

export function parseAdventureTags(tags?: string | null): string[] {
  if (!tags) return [];
  const raw = tags
    .split("^")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const unique = new Map<string, string>();
  raw.forEach((tag) => {
    const key = normalizeTag(tag);
    if (!unique.has(key)) unique.set(key, tag);
  });
  return Array.from(unique.values());
}

export function getUniverseFromTags(tags?: string | null): string | null {
  if (!tags) return null;
  const candidates = tags.split("^").map((tag) => tag.trim());
  const universeTag = candidates.find((tag) =>
    normalizeTag(tag).startsWith("вселенная:")
  );
  if (!universeTag) return null;
  const value = universeTag.split(":").slice(1).join(":").trim();
  return value || null;
}

export function isUniverseTag(tag: string) {
  return normalizeTag(tag).startsWith("вселенная:");
}

export function getTagVariant(tag: string): TagVariant {
  const normalized = normalizeTag(tag);
  if (normalized.startsWith("скидка")) return "discount";
  if (normalized.startsWith("сезон") || normalized.includes("приключение сезона")) return "season";
  if (normalized === "хит" || normalized === "бестселлер") return "hit";
  if (normalized === "новинка") return "new";
  if (normalized.includes("нович")) return "beginner";
  return "default";
}

export function isBeginnerTag(tag: string) {
  return getTagVariant(tag) === "beginner";
}
