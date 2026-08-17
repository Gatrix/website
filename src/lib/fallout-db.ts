import { getDbPool } from "@/lib/pg-pool";

/** URL-slug → имя персонажа в таблице fallout */
export const FALLOUT_CHARACTERS = {
  technik: "Техник",
  boets: "Боец",
  dozornyy: "Дозорный",
  tyagach: "Тягач",
  ten: "Тень",
  litso: "Лицо",
} as const;

export type FalloutSlug = keyof typeof FALLOUT_CHARACTERS;

export function isFalloutSlug(value: string): value is FalloutSlug {
  return Object.prototype.hasOwnProperty.call(FALLOUT_CHARACTERS, value);
}

export function falloutCharacterName(slug: FalloutSlug): string {
  return FALLOUT_CHARACTERS[slug];
}

/** Текст фразы персонажа из adventurespool.fallout. */
export async function fetchFalloutText(characterName: string): Promise<string | null> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn("[fallout] DATABASE_URL не задан");
    return null;
  }

  try {
    const pool = getDbPool();
    const { rows } = await pool.query<{ text: string }>(
      `SELECT text FROM fallout WHERE character_name = $1 LIMIT 1`,
      [characterName]
    );
    return rows[0]?.text ?? null;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      console.warn(
        "[fallout] таблица не найдена — примените db/adventurespool-fallout.sql на ВМ"
      );
      return null;
    }
    console.error("[fallout] fetchFalloutText:", err);
    return null;
  }
}
