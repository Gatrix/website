import type { Adventure, AdventureOptions } from "@/lib/db";
import { getDbPool } from "@/lib/pg-pool";
import { readObjectStorageText } from "@/lib/storage-client";

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function textArray(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return undefined;
}

function normalizeGenre(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map((g) => String(g));
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) return p.map((g) => String(g));
    } catch {
      return [raw];
    }
  }
  return undefined;
}

function parsePlayerCount(raw: unknown): { min: number; max: number } | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.min !== "number" || typeof o.max !== "number") return undefined;
  return { min: o.min, max: o.max };
}

const GAMEFORMAT_LABELS: Record<string, string> = {
  oneshot: "Ваншот",
  adventure: "Приключение",
  campaign: "Кампания",
};

function mapGameformatLabels(ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => GAMEFORMAT_LABELS[id] ?? id);
}

function formatList(names: string[] | undefined, separator = " · "): string | undefined {
  if (!names?.length) return undefined;
  return names.join(separator);
}

function validateSqlIdentifier(name: string, label: string): string {
  const n = name.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n)) {
    throw new Error(`${label} must match /^[a-zA-Z_][a-zA-Z0-9_]*$/`);
  }
  return n;
}

/**
 * БД adventurespool: adventures + M2M-справочники (subsettings, genres, gameformat, …).
 */
function buildAdventurespoolSql(adventuresTable: string): string {
  const table = validateSqlIdentifier(adventuresTable, "PG_ADVENTURES_TABLE");
  return `
WITH genre_agg AS (
  SELECT ag.adventure_id,
         array_agg(g.genre_name::text ORDER BY g.genre_name) AS genre_names
  FROM adventure_genres ag
  INNER JOIN genres g ON g.genre_id = ag.genre_id
  GROUP BY ag.adventure_id
),
subsetting_agg AS (
  SELECT asub.adventure_id,
         array_agg(ss.subsetting_name::text ORDER BY ss.subsetting_name) AS subsetting_names
  FROM adventure_subsettings asub
  INNER JOIN subsettings ss ON ss.subsetting_id = asub.subsetting_id
  GROUP BY asub.adventure_id
),
universe_agg AS (
  SELECT au.adventure_id,
         array_agg(u.universe_name::text ORDER BY u.universe_name) AS universe_names
  FROM adventure_universes au
  INNER JOIN universes u ON u.universe_id = au.universe_id
  GROUP BY au.adventure_id
),
gameformat_agg AS (
  SELECT agf.adventure_id,
         array_agg(gf.gameformat_id::text ORDER BY gf.gameformat_id) AS gameformat_ids,
         array_agg(gf.gameformat_name::text ORDER BY gf.gameformat_id) AS gameformat_names
  FROM adventure_gameformat agf
  INNER JOIN gameformat gf ON gf.gameformat_id = agf.gameformat_id
  GROUP BY agf.adventure_id
),
tags_agg AS (
  SELECT at.adventure_id,
         array_agg(t.tag_name::text ORDER BY t.tag_name) AS tag_names
  FROM adventure_tags at
  INNER JOIN tags t ON t.tag_id = at.tag_id
  GROUP BY at.adventure_id
)
SELECT
  a.adventure_id::text AS id,
  a.adventure_name AS title,
  a.adventure_intro AS intro,
  a.adventure_intro AS description,
  sa.subsetting_names[1] AS subsetting,
  ua.universe_names AS universe,
  ga.genre_names AS genre,
  gfa.gameformat_ids AS gameformat_ids,
  gfa.gameformat_names AS gameformat_names,
  ta.tag_names AS tag_names
FROM ${table} a
LEFT JOIN subsetting_agg sa ON sa.adventure_id = a.adventure_id
LEFT JOIN genre_agg ga ON ga.adventure_id = a.adventure_id
LEFT JOIN universe_agg ua ON ua.adventure_id = a.adventure_id
LEFT JOIN gameformat_agg gfa ON gfa.adventure_id = a.adventure_id
LEFT JOIN tags_agg ta ON ta.adventure_id = a.adventure_id
ORDER BY a.adventure_name ASC NULLS LAST
`.trim();
}

function adventurespoolRowToAdventure(row: Record<string, unknown>): Adventure {
  const id = String(row.id ?? "");
  const genreArr = textArray(row.genre);
  const universeArr = textArray(row.universe);
  const gameformatIds = textArray(row.gameformat_ids);
  const gameformatLabels = mapGameformatLabels(gameformatIds);
  const subsetting = row.subsetting != null ? String(row.subsetting) : undefined;

  return {
    id,
    title: String(row.title ?? ""),
    poster: id ? `${id}.webp` : undefined,
    intro: row.intro != null ? String(row.intro) : undefined,
    description: row.description != null ? String(row.description) : undefined,
    theme: subsetting,
    genre: genreArr,
    focus: genreArr,
    universe: universeArr?.[0],
    world: universeArr,
    subsetting,
    difficulty: "Нарратив · Тактика",
    gameformats: gameformatLabels.length > 0 ? gameformatLabels : undefined,
    adventure_type: formatList(gameformatLabels, ", ") ?? undefined,
    session_duration: "4–7 ч",
    tags: formatList(textArray(row.tag_names), ", "),
  };
}

function rowToAdventure(row: Record<string, unknown>): Adventure {
  const idRaw = pick(row, "id", "adventure_id");
  const id = idRaw != null ? String(idRaw) : "";

  return {
    id,
    title: String(pick(row, "title", "adventure_name") ?? ""),
    poster: pick(row, "poster") as string | undefined,
    img_url: pick(row, "img_url", "imgUrl") as string | undefined,
    intro: pick(row, "intro", "adventure_intro") as string | undefined,
    description: pick(row, "description") as string | undefined,
    theme: (() => {
      const t = pick(row, "theme");
      if (t == null) return undefined;
      const s = String(t).trim();
      return s || undefined;
    })(),
    genre: normalizeGenre(pick(row, "genre")),
    logline: pick(row, "logline") as string | undefined,
    tone: pick(row, "tone") as string | string[] | undefined,
    format: pick(row, "format") as string | undefined,
    durationHours: pick(row, "duration_hours", "durationHours") as string | undefined,
    durationMinutes: pick(row, "duration_minutes", "durationMinutes") as number | undefined,
    isBeginnerFriendly: pick(row, "is_beginner_friendly", "isBeginnerFriendly") as
      | boolean
      | undefined,
    contentWarnings: normalizeGenre(pick(row, "content_warnings", "contentWarnings")) as
      | string[]
      | undefined,
    highlights: normalizeGenre(pick(row, "highlights")) as string[] | undefined,
    benefits: normalizeGenre(pick(row, "benefits")) as string[] | undefined,
    ageRating: pick(row, "age_rating", "ageRating") as string | undefined,
    price: pick(row, "price") as string | undefined,
    priceLabel: pick(row, "price_label", "priceLabel") as string | undefined,
    hasUpcomingSlots7d: pick(row, "has_upcoming_slots_7d", "hasUpcomingSlots7d") as
      | boolean
      | undefined,
    playerCount: parsePlayerCount(pick(row, "playerCount")),
    player_count: pick(row, "player_count") as string | undefined,
    tags: pick(row, "tags") as string | undefined,
    universe: pick(row, "universe") as string | undefined,
    base_setting: pick(row, "base_setting", "baseSetting") as string | undefined,
    subsetting: pick(row, "subsetting") as string | undefined,
    world: pick(row, "world") as string | undefined,
    focus: pick(row, "focus") as string | undefined,
    difficulty: pick(row, "difficulty") as string | undefined,
    adventure_type: pick(row, "adventure_type", "adventureType") as string | undefined,
    gameformats: normalizeGenre(pick(row, "gameformats")) as string[] | undefined,
    session_duration: pick(row, "session_duration", "sessionDuration") as string | undefined,
    players: pick(row, "players") as string | undefined,
    time: pick(row, "time") as string | undefined,
    created_at:
      pick(row, "created_at", "createdAt") != null
        ? String(pick(row, "created_at", "createdAt"))
        : undefined,
  };
}

function validatedTableName(): string {
  const raw = (process.env.PG_ADVENTURES_TABLE || "adventures").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
    throw new Error(
      "PG_ADVENTURES_TABLE must match /^[a-zA-Z_][a-zA-Z0-9_]*$/ (schema: используйте представление или search_path)"
    );
  }
  return raw;
}

export async function fetchAdventuresFromDatabase(): Promise<Adventure[]> {
  const table = validatedTableName();
  const pool = getDbPool();
  const usePoolSchema = process.env.PG_ADVENTURES_SCHEMA !== "legacy";

  if (usePoolSchema) {
    const sql = buildAdventurespoolSql(table);
    const { rows } = await pool.query(sql);
    return rows.map((r) => adventurespoolRowToAdventure(r as Record<string, unknown>));
  }

  const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY title ASC`);
  return rows.map((r) => rowToAdventure(r as Record<string, unknown>));
}

function validatedOptionsTableName(): string {
  const raw = (process.env.PG_ADVENTURE_OPTIONS_TABLE || "adventure_options").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
    throw new Error("PG_ADVENTURE_OPTIONS_TABLE must match /^[a-zA-Z_][a-zA-Z0-9_]*$/");
  }
  return raw;
}

function isAdventureOptionsPayload(raw: unknown): raw is AdventureOptions {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  const rel = o.setting_relations;
  return (
    Array.isArray(o.base_setting) &&
    rel !== null &&
    typeof rel === "object" &&
    !Array.isArray(rel) &&
    Array.isArray(o.subsetting) &&
    Array.isArray(o.genre) &&
    Array.isArray(o.universe)
  );
}

function normalizeAdventureOptionsPayload(parsed: unknown): AdventureOptions | null {
  if (!isAdventureOptionsPayload(parsed)) return null;
  const p = parsed as unknown as Record<string, unknown>;
  const atRaw = p.adventure_type;
  let adventure_type: AdventureOptions["adventure_type"];
  if (Array.isArray(atRaw)) {
    adventure_type = atRaw
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map((x) => ({
        id: String(x.id ?? ""),
        label: String(x.label ?? x.id ?? ""),
        sessions: x.sessions != null ? String(x.sessions) : undefined,
      }))
      .filter((x) => x.id);
  }
  return {
    base_setting: parsed.base_setting.map(String),
    subsetting: parsed.subsetting.map(String),
    genre: parsed.genre.map(String),
    universe: parsed.universe.map(String),
    setting_relations: Object.fromEntries(
      Object.entries(parsed.setting_relations).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.map(String) : [],
      ])
    ),
    session_duration: parsed.session_duration?.map(String),
    player_count: parsed.player_count?.map(String),
    adventure_type,
  };
}

/** Справочники из adventurespool для фильтров на странице приключений. */
export async function fetchAdventureOptionsFromLookups(): Promise<AdventureOptions | null> {
  try {
    const pool = getDbPool();
    const [subRes, genreRes, uniRes, gfRes] = await Promise.all([
      pool.query<{ subsetting_name: string }>(
        `SELECT subsetting_name FROM subsettings ORDER BY subsetting_name`
      ),
      pool.query<{ genre_name: string }>(`SELECT genre_name FROM genres ORDER BY genre_name`),
      pool.query<{ universe_name: string }>(
        `SELECT universe_name FROM universes ORDER BY universe_name`
      ),
      pool.query<{ gameformat_name: string }>(
        `SELECT gameformat_name FROM gameformat ORDER BY gameformat_id`
      ),
    ]);

    return {
      base_setting: [],
      subsetting: subRes.rows.map((r) => r.subsetting_name),
      genre: genreRes.rows.map((r) => r.genre_name),
      universe: uniRes.rows.map((r) => r.universe_name),
      setting_relations: {},
      adventure_type: gfRes.rows.map((r) => ({
        id: r.gameformat_name,
        label: r.gameformat_name,
      })),
    };
  } catch (err) {
    console.warn("[adventures-db] справочники adventurespool для фильтров:", err);
    return null;
  }
}

export async function fetchAdventureOptionsFromDatabase(): Promise<AdventureOptions | null> {
  try {
    const table = validatedOptionsTableName();
    const pool = getDbPool();
    const { rows } = await pool.query(`SELECT data FROM ${table} LIMIT 1`);
    const raw = rows[0]?.data;
    if (raw == null) return null;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeAdventureOptionsPayload(parsed);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const tbl = process.env.PG_ADVENTURE_OPTIONS_TABLE || "adventure_options";
    if (code === "42P01") {
      console.warn(
        `[adventures-db] таблица "${tbl}" не найдена — фильтры из справочников adventurespool или из приключений`
      );
    } else {
      console.error("[adventures-db] adventure_options:", err);
    }
    return null;
  }
}

export async function fetchAdventureOptionsFromObjectStorage(): Promise<AdventureOptions | null> {
  const prefixRaw = (process.env.YC_STORAGE_PREFIX ?? "").trim();
  const prefix = prefixRaw && !prefixRaw.endsWith("/") ? `${prefixRaw}/` : prefixRaw;
  const key = `${prefix}adventure-options.json`;
  const text = await readObjectStorageText(key);
  if (!text?.trim()) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    const out = normalizeAdventureOptionsPayload(parsed);
    if (out) {
      console.info(`[adventures-db] adventure-options из Object Storage: ${key}`);
    }
    return out;
  } catch {
    return null;
  }
}
