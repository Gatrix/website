import type { Adventure, AdventureOptions } from "@/lib/db";

/**
 * Если таблицы adventure_options нет, собираем списки для фильтров из фактических полей приключений.
 */
export function deriveAdventureOptionsFromAdventures(adventures: Adventure[]): AdventureOptions {
  const bases = new Set<string>();
  const subs = new Set<string>();
  const genres = new Set<string>();
  const worlds = new Set<string>();
  const baseToSubs = new Map<string, Set<string>>();

  const addBases = (raw: unknown) => {
    if (raw == null) return;
    if (Array.isArray(raw)) {
      raw.forEach((x) => bases.add(String(x).trim()));
      return;
    }
    if (typeof raw === "string") {
      raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((b) => bases.add(b));
    }
  };

  for (const adv of adventures) {
    addBases(adv.base_setting);

    if (adv.subsetting) {
      subs.add(adv.subsetting);
      const advBases: string[] = [];
      const bs = adv.base_setting as string | string[] | undefined;
      if (bs) {
        if (typeof bs === "string") {
          bs.split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((b) => advBases.push(b));
        } else if (Array.isArray(bs)) {
          bs.forEach((b) => advBases.push(String(b)));
        }
      }
      for (const b of advBases.length > 0 ? advBases : [""]) {
        if (!b) continue;
        if (!baseToSubs.has(b)) baseToSubs.set(b, new Set());
        baseToSubs.get(b)!.add(adv.subsetting);
      }
    }

    const g = adv.genre;
    if (Array.isArray(g)) g.forEach((x) => genres.add(String(x)));
    else if (typeof g === "string") genres.add(g);

    if (adv.universe) worlds.add(adv.universe);
    if (Array.isArray(adv.world)) adv.world.forEach((w) => worlds.add(w));
    else if (adv.world) worlds.add(adv.world);
  }

  const setting_relations: Record<string, string[]> = {};
  for (const b of bases) {
    const set = baseToSubs.get(b);
    setting_relations[b] = set ? Array.from(set).sort() : [];
  }

  return {
    base_setting: Array.from(bases).sort(),
    subsetting: Array.from(subs).sort(),
    genre: Array.from(genres).sort(),
    universe: Array.from(worlds).sort(),
    setting_relations,
  };
}
