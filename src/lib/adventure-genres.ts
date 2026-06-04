import type { Adventure } from "@/lib/db";

/** Жанры приключения для отображения (genre, иначе focus). */
export function adventureGenres(adventure: Adventure): string[] {
  const genre = adventure.genre;
  if (genre?.length) {
    return genre.map((g) => g.trim()).filter(Boolean);
  }
  const focus = adventure.focus;
  if (Array.isArray(focus)) {
    return focus.map((f) => String(f).trim()).filter(Boolean);
  }
  if (typeof focus === "string" && focus.trim()) {
    return [focus.trim()];
  }
  return [];
}

/** Название игрового мира / вселенной для отображения (одно значение). */
export function adventureWorldName(adventure: Adventure): string | null {
  const uni = adventure.universe?.trim();
  if (uni) return uni;
  const world = adventure.world;
  if (typeof world === "string" && world.trim()) return world.trim();
  if (Array.isArray(world)) {
    const first = world.map((w) => String(w).trim()).find(Boolean);
    if (first) return first;
  }
  return null;
}
