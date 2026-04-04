import { getDbPool } from "@/lib/pg-pool";

function siteSettingsTable(): string {
  const t = (process.env.PG_SITE_SETTINGS_TABLE || "site_settings").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
    throw new Error("PG_SITE_SETTINGS_TABLE must match /^[a-zA-Z_][a-zA-Z0-9_]*$/");
  }
  return t;
}

const FRONT_KEY = process.env.PG_SITE_SETTINGS_FRONT_PHOTOS_KEY || "frontpage_photos";

/**
 * Массив путей к объектам в бакете (как раньше в frontpage-photos.json), например ["photos/front/1.webp"].
 */
export async function fetchFrontpagePhotoPathsFromDatabase(): Promise<string[]> {
  try {
    const pool = getDbPool();
    const { rows } = await pool.query(
      `SELECT value FROM ${siteSettingsTable()} WHERE key = $1 LIMIT 1`,
      [FRONT_KEY]
    );
    const raw = rows[0]?.value;
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") {
      try {
        const p = JSON.parse(raw) as unknown;
        if (Array.isArray(p)) return p.map(String);
      } catch {
        return [];
      }
    }
    return [];
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      console.warn(
        `[site_settings] таблица не найдена — блок фото на главной пустой, пока не создадите schema (db/schema.sql)`
      );
    } else {
      console.error("[site_settings] frontpage_photos:", err);
    }
    return [];
  }
}
