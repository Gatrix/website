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

/** Подписи для adventure_type_id из справочника в adventure-options.json */
const ADVENTURE_TYPE_LABELS: Record<string, string> = {
  oneshot: "Ваншот",
  adventure: "Приключение",
  campaign: "Кампания",
};

function mapAdventureTypeId(id: unknown): string | undefined {
  if (id == null || id === "") return undefined;
  const s = String(id).trim();
  return ADVENTURE_TYPE_LABELS[s] ?? s;
}

function validateSqlIdentifier(name: string, label: string): string {
  const n = name.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n)) {
    throw new Error(`${label} must match /^[a-zA-Z_][a-zA-Z0-9_]*$/`);
  }
  return n;
}

/** Колонка с подписью в справочнике (имена таблиц фиксированы, поля у всех разные). */
function lookupColumn(envKey: string, defaultCol: string): string {
  return validateSqlIdentifier(process.env[envKey] || defaultCol, envKey);
}

/**
 * Запрос: adventures + FK → человекочитаемые строки для карточек и фильтров.
 * Справочники: base_settings, subsettings, universes, difficulties, session_durations, player_counts, genres через adventure_genres.
 */
function buildNormalizedAdventuresSql(adventuresTable: string): string {
  const posterCol = validateSqlIdentifier(
    process.env.PG_ADVENTURES_POSTER_COLUMN || "poster",
    "PG_ADVENTURES_POSTER_COLUMN"
  );
  const cBase = lookupColumn("PG_LOOKUP_BASE_SETTINGS_COLUMN", "name");
  const cSub = lookupColumn("PG_LOOKUP_SUBSETTINGS_COLUMN", "name");
  const cUni = lookupColumn("PG_LOOKUP_UNIVERSES_COLUMN", "name");
  /** Пока не задано в .env — берётся id; задайте колонку с подписью сложности (как в DBeaver). */
  const cDif = lookupColumn("PG_LOOKUP_DIFFICULTIES_COLUMN", "id");
  const cSd = lookupColumn("PG_LOOKUP_SESSION_DURATIONS_COLUMN", "label");
  const cPc = lookupColumn("PG_LOOKUP_PLAYER_COUNTS_COLUMN", "label");
  const cGen = lookupColumn("PG_LOOKUP_GENRES_COLUMN", "name");
  return `
WITH genre_agg AS (
  SELECT ag.adventure_id,
         array_agg(g.${cGen}::text ORDER BY g.${cGen}) AS genre_names
  FROM adventure_genres ag
  INNER JOIN genres g ON g.id = ag.genre_id
  GROUP BY ag.adventure_id
)
SELECT
  a.id::text AS id,
  COALESCE(a.title, '') AS title,
  a.intro,
  a.description,
  a.theme,
  a.${posterCol} AS poster,
  bs.${cBase} AS base_setting,
  ss.${cSub} AS subsetting,
  u.${cUni} AS universe,
  d.${cDif}::text AS difficulty,
  a.adventure_type_id::text AS adventure_type_id,
  sd.${cSd}::text AS session_duration,
  pc.${cPc}::text AS player_count,
  ga.genre_names AS genre
FROM ${adventuresTable} a
LEFT JOIN base_settings bs ON bs.id = a.base_setting_id
LEFT JOIN subsettings ss ON ss.id = a.subsetting_id
LEFT JOIN universes u ON u.id = a.universe_id
LEFT JOIN difficulties d ON d.id = a.difficulty_id
LEFT JOIN session_durations sd ON sd.id = a.session_duration_id
LEFT JOIN player_counts pc ON pc.id = a.player_count_id
LEFT JOIN genre_agg ga ON ga.adventure_id = a.id
ORDER BY a.title ASC NULLS LAST
`.trim();
}

function normalizedSqlRowToAdventure(row: Record<string, unknown>): Adventure {
  const genreRaw = row.genre;
  const genreArr = Array.isArray(genreRaw)
    ? genreRaw.map(String)
    : genreRaw != null
      ? [String(genreRaw)]
      : undefined;

  const universeStr = row.universe != null ? String(row.universe) : undefined;

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    poster: row.poster != null ? String(row.poster) : undefined,
    intro: row.intro != null ? String(row.intro) : undefined,
    description: row.description != null ? String(row.description) : undefined,
    theme: row.theme != null ? String(row.theme).trim() || undefined : undefined,
    genre: genreArr,
    universe: universeStr,
    world: universeStr,
    base_setting: row.base_setting != null ? String(row.base_setting) : undefined,
    subsetting: row.subsetting != null ? String(row.subsetting) : undefined,
    difficulty: row.difficulty != null ? String(row.difficulty) : undefined,
    adventure_type: mapAdventureTypeId(row.adventure_type_id),
    session_duration: row.session_duration != null ? String(row.session_duration) : undefined,
    player_count: row.player_count != null ? String(row.player_count) : undefined,
  };
}

function rowToAdventure(row: Record<string, unknown>): Adventure {
  const idRaw = pick(row, "id");
  const id = idRaw != null ? String(idRaw) : "";

  return {
    id,
    title: String(pick(row, "title") ?? ""),
    poster: pick(row, "poster") as string | undefined,
    img_url: pick(row, "img_url", "imgUrl") as string | undefined,
    intro: pick(row, "intro") as string | undefined,
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
    session_duration: pick(row, "session_duration", "sessionDuration") as string | undefined,
    players: pick(row, "players") as string | undefined,
    time: pick(row, "time") as string | undefined,
    created_at:
      pick(row, "created_at", "createdAt") != null
        ? String(pick(row, "created_at", "createdAt"))
        : undefined,
  };
}

/**
 * Имя таблицы из PG_ADVENTURES_TABLE (по умолчанию adventures).
 * Допускаются только буквы, цифры и подчёркивание.
 */
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
  const useNormalized = process.env.PG_ADVENTURES_NORMALIZED !== "0";

  if (useNormalized) {
    try {
      const sql = buildNormalizedAdventuresSql(table);
      const { rows } = await pool.query(sql);
      return rows.map((r) => normalizedSqlRowToAdventure(r as Record<string, unknown>));
    } catch (err) {
      console.error(
        "[adventures-db] JOIN-запрос к справочникам не выполнен (проверьте имена таблиц/колонок или создайте VIEW). Подробности:",
        err
      );
    }
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

/** Одна строка в таблице, колонка data (jsonb). При отсутствии таблицы или ошибке — null (без throw). */
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
        `[adventures-db] таблица "${tbl}" не найдена — фильтры можно задать в БД или они соберутся из приключений`
      );
    } else {
      console.error("[adventures-db] adventure_options:", err);
    }
    return null;
  }
}

/**
 * Файл adventure-options.json в бакете (часто data/adventure-options.json).
 * Нужны YC_STORAGE_BUCKET + ключи и YC_STORAGE_PREFIX=data/ (или пусто, если файл в корне бакета).
 */
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
