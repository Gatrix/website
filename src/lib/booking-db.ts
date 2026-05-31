import type { Adventure } from "@/lib/db";
import { defaultFormatFromAdventure } from "@/lib/booking-config-utils";
import { getDbPool } from "@/lib/pg-pool";
import type {
  BookingBounds,
  BookingConfigPayload,
  BookingDifficulty,
  BookingGameSystem,
  BookingUniverse,
  FormatInfo,
  GameFormatId,
  WarningRule,
} from "@/lib/booking-types";

const DEFAULT_BOUNDS: BookingBounds = {
  minPlayers: 3,
  maxPlayers: 6,
  minDurationHours: 4,
  maxDurationHours: 8,
};

const DEFAULT_FORMATS: FormatInfo[] = [
  {
    id: "oneshot",
    title: "Ваншот",
    description:
      "Одна завершённая история за столом: приходите с нуля и за вечер получаете цельный опыт. Идеально, чтобы познакомиться с миром и правилами без долгих обязательств.",
  },
  {
    id: "adventure",
    title: "Приключение",
    description:
      "Несколько связанных сессий с общим сюжетом и развитием персонажей. Баланс между глубиной истории и понятным горизонтом планирования.",
  },
  {
    id: "campaign",
    title: "Кампания",
    description:
      "Долгая арка: растущие ставки, побочные линии и память мира между встречами. Требует стабильного состава и терпения к паузам между играми.",
  },
];

const FORMAT_ORDER: GameFormatId[] = ["oneshot", "adventure", "campaign"];

function shouldUsePoolSchema(): boolean {
  return process.env.PG_ADVENTURES_SCHEMA !== "legacy";
}

function parsePlayerRange(s: string | undefined): { min: number; max: number } | null {
  if (!s?.trim()) return null;
  const m = s.trim().match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

function adventureFallbackBounds(a: Adventure): BookingBounds {
  const fromObj = a.playerCount;
  if (fromObj && typeof fromObj.min === "number" && typeof fromObj.max === "number") {
    return {
      minPlayers: fromObj.min,
      maxPlayers: fromObj.max,
      minDurationHours: DEFAULT_BOUNDS.minDurationHours,
      maxDurationHours: DEFAULT_BOUNDS.maxDurationHours,
    };
  }
  const parsed = parsePlayerRange(a.player_count ?? a.players);
  if (parsed) {
    return {
      minPlayers: parsed.min,
      maxPlayers: parsed.max,
      minDurationHours: DEFAULT_BOUNDS.minDurationHours,
      maxDurationHours: DEFAULT_BOUNDS.maxDurationHours,
    };
  }
  return { ...DEFAULT_BOUNDS };
}

function isMissingRelationError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "42P01" || code === "42703";
}

function pickDefaultUniverse(a: Adventure, list: BookingUniverse[]): string | undefined {
  if (!list.length) return undefined;
  const candidates = [a.universe, ...(a.world ?? [])]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim().toLowerCase());
  for (const u of list) {
    const id = u.id.toLowerCase();
    const name = u.name.toLowerCase();
    if (candidates.some((c) => c === id || c === name)) return u.id;
  }
  return list[0].id;
}

function staticPayload(a: Adventure): BookingConfigPayload {
  return {
    adventureId: a.id,
    adventureTitle: a.title ?? "",
    systems: [],
    difficulties: [],
    universes: [],
    bounds: adventureFallbackBounds(a),
    formats: DEFAULT_FORMATS,
    warningRules: [],
    warnings: [],
    defaultAdventureType: defaultFormatFromAdventure(a),
  };
}

// --- adventurespool ---

async function fetchPoolGameSystemsForAdventure(adventureId: string): Promise<BookingGameSystem[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT gs.gamesystem_id, gs.gamesystem_name
    FROM adventure_gamesystems ags
    INNER JOIN gamesystems gs ON gs.gamesystem_id = ags.gamesystem_id
    WHERE ags.adventure_id = $1::text
    ORDER BY
      CASE gs.gamesystem_id
        WHEN 'original-full' THEN 1
        WHEN 'original-simple' THEN 2
        ELSE 3
      END,
      REPLACE(gs.gamesystem_id, '-simple', ''),
      CASE WHEN gs.gamesystem_id LIKE '%-simple' THEN 1 ELSE 0 END,
      gs.gamesystem_name
    `,
    [adventureId]
  );
  return rows.map((r) => {
    const id = String(r.gamesystem_id);
    return {
      id,
      slug: id,
      name: String(r.gamesystem_name),
      description: "",
      rulebook: null,
    };
  });
}

async function fetchPoolDifficulties(adventureId: string): Promise<BookingDifficulty[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT d.difficulty_id, d.difficulty_name, d.difficulty_description
    FROM adventure_difficulty ad
    INNER JOIN difficulty d ON d.difficulty_id = ad.difficulty_id
    WHERE ad.adventure_id = $1::text
    ORDER BY CASE d.difficulty_id WHEN 'narrative' THEN 1 WHEN 'tactic' THEN 2 ELSE 3 END
    `,
    [adventureId]
  );
  return rows.map((r) => ({
    id: String(r.difficulty_id),
    name: String(r.difficulty_name),
    description: String(r.difficulty_description ?? ""),
  }));
}

async function fetchPoolGametimeBounds(adventureId: string): Promise<{ min: number; max: number } | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT
      MIN(CAST(g.gametime_id AS INTEGER)) AS min_h,
      MAX(CAST(g.gametime_id AS INTEGER)) AS max_h
    FROM adventure_gametime ag
    INNER JOIN gametime g ON g.gametime_id = ag.gametime_id
    WHERE ag.adventure_id = $1::text
    `,
    [adventureId]
  );
  const row = rows[0];
  if (!row || row.min_h == null || row.max_h == null) return null;
  return { min: Number(row.min_h), max: Number(row.max_h) };
}

async function fetchPoolUniversesForAdventure(adventureId: string): Promise<BookingUniverse[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT u.universe_id, u.universe_name
    FROM adventure_universes au
    INNER JOIN universes u ON u.universe_id = au.universe_id
    WHERE au.adventure_id = $1::text
    ORDER BY u.universe_name ASC
    `,
    [adventureId]
  );
  return rows.map((r) => ({
    id: String(r.universe_id),
    name: String(r.universe_name),
  }));
}

/** Только форматы, привязанные к приключению в adventure_gameformat. */
async function fetchPoolFormatsForAdventure(adventureId: string): Promise<FormatInfo[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT gf.gameformat_id
    FROM adventure_gameformat agf
    INNER JOIN gameformat gf ON gf.gameformat_id = agf.gameformat_id
    WHERE agf.adventure_id = $1::text
    `,
    [adventureId]
  );
  const linked = new Set(rows.map((r) => String(r.gameformat_id)));
  return FORMAT_ORDER.filter((id) => linked.has(id)).map((id) => {
    const def = DEFAULT_FORMATS.find((d) => d.id === id)!;
    return { ...def };
  });
}

async function getPoolBookingConfig(a: Adventure): Promise<BookingConfigPayload> {
  const adventureId = a.id;
  const playerBounds = adventureFallbackBounds(a);
  let bounds: BookingBounds = { ...playerBounds };

  let systems: BookingGameSystem[] = [];
  let difficulties: BookingDifficulty[] = [];
  let universes: BookingUniverse[] = [];
  let gametime: { min: number; max: number } | null = null;
  let formats: FormatInfo[] = [];
  let warningRules: WarningRule[] = [];
  let warnings: { id: number; message: string }[] = [];

  try {
    systems = await fetchPoolGameSystemsForAdventure(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_gamesystems:", err);
  }

  try {
    difficulties = await fetchPoolDifficulties(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_difficulty:", err);
  }

  try {
    gametime = await fetchPoolGametimeBounds(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_gametime:", err);
  }

  try {
    formats = await fetchPoolFormatsForAdventure(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_gameformat:", err);
  }

  try {
    universes = await fetchPoolUniversesForAdventure(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_universes:", err);
  }

  try {
    const w = await fetchLegacyWarningsAndRules(adventureId);
    warningRules = w.rules;
    warnings = w.warnings;
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] booking_warnings/rules:", err);
  }

  if (gametime) {
    bounds = {
      ...bounds,
      minDurationHours: gametime.min,
      maxDurationHours: gametime.max,
    };
  }

  const preferred = defaultFormatFromAdventure(a);
  const defaultAdventureType = formats.some((f) => f.id === preferred)
    ? preferred
    : formats[0]?.id;

  return {
    adventureId,
    adventureTitle: a.title ?? "",
    systems,
    difficulties,
    universes,
    bounds,
    formats,
    warningRules,
    warnings,
    defaultAdventureType,
    defaultUniverseId: pickDefaultUniverse(a, universes),
  };
}

// --- legacy schema ---

async function fetchLegacySystemsForAdventure(adventureId: string): Promise<BookingGameSystem[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT gs.id, gs.slug, gs.name, gs.description
    FROM adventure_game_systems ags
    INNER JOIN game_systems gs ON gs.id = ags.game_system_id
    WHERE ags.adventure_id = $1::text
    ORDER BY gs.sort_order ASC, gs.name ASC
    `,
    [adventureId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
  }));
}

async function fetchLegacyBoundsRow(adventureId: string): Promise<BookingBounds | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `
    SELECT min_players, max_players, min_duration_hours, max_duration_hours
    FROM adventure_booking_bounds
    WHERE adventure_id = $1::text
    `,
    [adventureId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    minPlayers: Number(row.min_players),
    maxPlayers: Number(row.max_players),
    minDurationHours: Number(row.min_duration_hours),
    maxDurationHours: Number(row.max_duration_hours),
  };
}

async function fetchLegacyFormats(): Promise<FormatInfo[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT format_id, title, description FROM game_format_info ORDER BY
       CASE format_id WHEN 'oneshot' THEN 1 WHEN 'adventure' THEN 2 WHEN 'campaign' THEN 3 ELSE 4 END`
  );
  if (!rows.length) return DEFAULT_FORMATS;
  const mapped = rows
    .map((r) => ({
      id: String(r.format_id) as GameFormatId,
      title: String(r.title),
      description: String(r.description ?? ""),
    }))
    .filter((x) => FORMAT_ORDER.includes(x.id));
  const list: FormatInfo[] = [];
  for (const id of FORMAT_ORDER) {
    const f = mapped.find((m) => m.id === id);
    if (f) list.push(f);
    else {
      const def = DEFAULT_FORMATS.find((d) => d.id === id);
      if (def) list.push(def);
    }
  }
  return list.length ? list : DEFAULT_FORMATS;
}

async function fetchLegacyWarningsAndRules(adventureId: string): Promise<{
  rules: WarningRule[];
  warnings: { id: number; message: string }[];
}> {
  const pool = getDbPool();
  const rulesRes = await pool.query<Record<string, unknown>>(
    `
    SELECT r.id AS rule_id, r.warning_id, r.adventure_id, r.match_json
    FROM booking_warning_rules r
    WHERE r.adventure_id IS NULL OR r.adventure_id::text = $1::text
    `,
    [adventureId]
  );
  const warnRes = await pool.query<Record<string, unknown>>(`SELECT id, message FROM booking_warnings`);

  const warnings = warnRes.rows.map((w) => ({
    id: Number(w.id),
    message: String(w.message ?? ""),
  }));

  const rules: WarningRule[] = rulesRes.rows.map((row) => {
    const mj = row.match_json;
    const match =
      mj && typeof mj === "object" && !Array.isArray(mj)
        ? (mj as Record<string, unknown>)
        : {};
    return {
      ruleId: Number(row.rule_id),
      warningId: Number(row.warning_id),
      adventureId: row.adventure_id != null ? String(row.adventure_id) : null,
      match,
    };
  });

  return { rules, warnings };
}

async function getLegacyBookingConfig(a: Adventure): Promise<BookingConfigPayload> {
  const adventureId = a.id;
  const adventureTitle = a.title ?? "";

  let systems: BookingGameSystem[] = [];
  let boundsMerged: BookingBounds = adventureFallbackBounds(a);
  let formats = DEFAULT_FORMATS;
  let warningRules: WarningRule[] = [];
  let warnings: { id: number; message: string }[] = [];

  try {
    systems = await fetchLegacySystemsForAdventure(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] game_systems:", err);
  }

  try {
    const rowBounds = await fetchLegacyBoundsRow(adventureId);
    if (rowBounds) boundsMerged = rowBounds;
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_booking_bounds:", err);
  }

  try {
    formats = await fetchLegacyFormats();
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] game_format_info:", err);
  }

  try {
    const w = await fetchLegacyWarningsAndRules(adventureId);
    warningRules = w.rules;
    warnings = w.warnings;
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] booking_warnings/rules:", err);
  }

  return {
    adventureId,
    adventureTitle,
    systems,
    difficulties: [],
    universes: [],
    bounds: boundsMerged,
    formats,
    warningRules,
    warnings,
    defaultAdventureType: defaultFormatFromAdventure(a),
  };
}

/**
 * Собирает конфиг формы заявки из БД (adventurespool или legacy).
 */
export async function getBookingConfigForAdventure(a: Adventure): Promise<BookingConfigPayload> {
  if (!process.env.DATABASE_URL?.trim()) {
    return staticPayload(a);
  }

  if (shouldUsePoolSchema()) {
    return getPoolBookingConfig(a);
  }

  return getLegacyBookingConfig(a);
}

/** Если запрос к БД невозможен, возвращает безопасный минимальный конфиг. */
export async function getBookingConfigSafe(a: Adventure): Promise<BookingConfigPayload> {
  try {
    return await getBookingConfigForAdventure(a);
  } catch (err) {
    console.warn("[booking-db] getBookingConfigSafe fallback:", err);
    return staticPayload(a);
  }
}

export type BookingRequestInsert = {
  adventureId: string;
  adventureTitle: string;
  gameSystemId: string | null;
  gameSystemName: string | null;
  difficultyId: string | null;
  difficultyName: string | null;
  universeId: string | null;
  universeName: string | null;
  playerCount: number;
  durationHours: number;
  adventureType: string;
  playerNote: string;
  phone: string;
  warningIds: number[];
  warningMessages: string[];
  clientMeta?: Record<string, unknown>;
};

export async function insertBookingRequest(
  params: BookingRequestInsert
): Promise<{ id: string } | null> {
  try {
    const pool = getDbPool();
    const { rows } = await pool.query<{ id: string }>(
      `
      INSERT INTO booking_requests (
        adventure_id,
        adventure_title,
        game_system_id,
        game_system_name,
        difficulty_id,
        difficulty_name,
        universe_id,
        universe_name,
        player_count,
        duration_hours,
        adventure_type,
        player_note,
        phone,
        warning_ids,
        warning_messages,
        client_meta
      )
      VALUES (
        $1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text,
        $9::int, $10::numeric, $11::text, $12::text, $13::text, $14::int[], $15::text[], $16::jsonb
      )
      RETURNING id::text AS id
      `,
      [
        params.adventureId,
        params.adventureTitle,
        params.gameSystemId,
        params.gameSystemName,
        params.difficultyId,
        params.difficultyName,
        params.universeId,
        params.universeName,
        params.playerCount,
        params.durationHours,
        params.adventureType,
        params.playerNote,
        params.phone,
        params.warningIds,
        params.warningMessages,
        params.clientMeta != null ? JSON.stringify(params.clientMeta) : null,
      ]
    );
    const id = rows[0]?.id;
    return id ? { id } : null;
  } catch (err) {
    console.error("[booking-db] insert booking_requests:", err);
    return null;
  }
}
