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
  maxDurationHours: 7,
};

const DEFAULT_DIFFICULTIES: BookingDifficulty[] = [
  {
    id: "narrative",
    name: "Нарратив",
    description:
      "Легкая форма игры, в которой акцент сделан на истории. Случайность благоволит героям, а правила упрощены в угоду отыгрышу.",
  },
  {
    id: "tactic",
    name: "Тактика",
    description:
      "Для тех, кто хочет вызова и более игровой структуры. Главенствование правил над историей.",
  },
];

const DEFAULT_FORMATS: FormatInfo[] = [
  {
    id: "oneshot",
    title: "Ваншот",
    description:
      "Игра на одну встречу. Быстрый старт, простая цель, минимум подготовки. Прекрасно подходит новичкам как отправная точка в мир НРИ.",
  },
  {
    id: "adventure",
    title: "Приключение",
    description:
      "Законченная история длиной в несколько встреч. Сбалансированный вариант. Идеально для знакомства с правилами и миром игры.",
  },
  {
    id: "campaign",
    title: "Кампания",
    description:
      "Длинная история на десятки игровых встреч. Глубокий сюжет и персонажи, развитие игроков. Для создания историй, о которых помнят всю жизнь.",
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

function isMissingColumnError(err: unknown, column: string): boolean {
  const e = err as { code?: string; message?: string };
  return e.code === "42703" && (e.message?.includes(column) ?? false);
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
    difficulties: DEFAULT_DIFFICULTIES,
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

function mapPoolFormatRows(rows: Record<string, unknown>[]): FormatInfo[] {
  const byId = new Map(rows.map((r) => [String(r.gameformat_id), r]));
  return FORMAT_ORDER.filter((id) => byId.has(id)).map((id) => {
    const row = byId.get(id)!;
    const def = DEFAULT_FORMATS.find((d) => d.id === id)!;
    const desc = row.gameformat_description;
    return {
      id,
      title: String(row.gameformat_name ?? def.title),
      description: desc != null && String(desc).trim() !== "" ? String(desc) : def.description,
    };
  });
}

/** Только форматы, привязанные к приключению в adventure_gameformat. */
async function fetchPoolFormatsForAdventure(adventureId: string): Promise<FormatInfo[]> {
  const pool = getDbPool();
  const baseSql = `
    SELECT gf.gameformat_id, gf.gameformat_name
    FROM adventure_gameformat agf
    INNER JOIN gameformat gf ON gf.gameformat_id = agf.gameformat_id
    WHERE agf.adventure_id = $1::text
  `;
  const sqlWithDescription = baseSql.replace(
    "gf.gameformat_name",
    "gf.gameformat_name, gf.gameformat_description"
  );
  try {
    const { rows } = await pool.query<Record<string, unknown>>(sqlWithDescription, [adventureId]);
    return mapPoolFormatRows(rows);
  } catch (err) {
    if (!isMissingColumnError(err, "gameformat_description")) throw err;
    const { rows } = await pool.query<Record<string, unknown>>(baseSql, [adventureId]);
    return mapPoolFormatRows(rows);
  }
}

async function getPoolBookingConfig(a: Adventure): Promise<BookingConfigPayload> {
  const adventureId = a.id;
  const playerBounds = adventureFallbackBounds(a);
  let bounds: BookingBounds = { ...playerBounds };

  let systems: BookingGameSystem[] = [];
  let universes: BookingUniverse[] = [];
  let formats: FormatInfo[] = [];
  let warningRules: WarningRule[] = [];
  let warnings: { id: number; message: string }[] = [];

  try {
    systems = await fetchPoolGameSystemsForAdventure(adventureId);
  } catch (err) {
    if (!isMissingRelationError(err)) console.error("[booking-db] adventure_gamesystems:", err);
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

  const preferred = defaultFormatFromAdventure(a);
  const defaultAdventureType = formats.some((f) => f.id === preferred)
    ? preferred
    : formats[0]?.id;

  return {
    adventureId,
    adventureTitle: a.title ?? "",
    systems,
    difficulties: DEFAULT_DIFFICULTIES,
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
    difficulties: DEFAULT_DIFFICULTIES,
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
  startsAt: string;
  endsAt: string;
  clientMeta?: Record<string, unknown>;
};

export class BookingSlotConflictError extends Error {
  constructor(message = "Это время уже занято. Выберите другой слот.") {
    super(message);
    this.name = "BookingSlotConflictError";
  }
}

export class BookingStorageError extends Error {
  constructor(
    message = "Не удалось сохранить заявку. Попробуйте позже или свяжитесь с клубом."
  ) {
    super(message);
    this.name = "BookingStorageError";
  }
}

export async function insertBookingRequest(
  params: BookingRequestInsert
): Promise<{ id: string } | null> {
  const pool = getDbPool();
  const client = await pool.connect();

  const insertRequest = async (includeStartsAt: boolean) => {
    const columns = includeStartsAt
      ? `
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
        starts_at,
        client_meta
      `
      : `
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
      `;

    const values = includeStartsAt
      ? `
        $1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text,
        $9::int, $10::numeric, $11::text, $12::text, $13::text, $14::int[], $15::text[], $16::timestamptz, $17::jsonb
      `
      : `
        $1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text,
        $9::int, $10::numeric, $11::text, $12::text, $13::text, $14::int[], $15::text[], $16::jsonb
      `;

    const queryParams = [
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
      ...(includeStartsAt
        ? [params.startsAt, params.clientMeta != null ? JSON.stringify(params.clientMeta) : null]
        : [params.clientMeta != null ? JSON.stringify(params.clientMeta) : null]),
    ];

    return client.query<{ id: string }>(
      `
      INSERT INTO booking_requests (${columns})
      VALUES (${values})
      RETURNING id::text AS id
      `,
      queryParams
    );
  };

  try {
    await client.query("BEGIN");
    await client.query("SAVEPOINT insert_request");

    let rows: { id: string }[];
    try {
      ({ rows } = await insertRequest(true));
    } catch (err) {
      if (!isMissingColumnError(err, "starts_at")) throw err;
      console.warn(
        "[booking-db] booking_requests.starts_at missing — apply db/adventurespool-booking-requests-add-starts-at.sql"
      );
      await client.query("ROLLBACK TO SAVEPOINT insert_request");
      ({ rows } = await insertRequest(false));
    }

    const id = rows[0]?.id;
    if (!id) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      INSERT INTO booking_schedule (
        starts_at,
        ends_at,
        duration_hours,
        status,
        booking_request_id
      )
      VALUES ($1::timestamptz, $2::timestamptz, $3::numeric, 'confirmed', $4::bigint)
      `,
      [params.startsAt, params.endsAt, params.durationHours, id]
    );

    await client.query("COMMIT");
    return { id };
  } catch (err) {
    await client.query("ROLLBACK");
    const code = (err as { code?: string })?.code;
    if (code === "23P01") {
      throw new BookingSlotConflictError();
    }
    if (code === "42501") {
      throw new BookingStorageError(
        "Сервер не может записать время в расписание. Администратору нужно выполнить db/adventurespool-booking-production-patch.sql на ВМ."
      );
    }
    if (code === "42703") {
      throw new BookingStorageError(
        "В базе не настроена таблица заявок. Администратору нужно выполнить db/adventurespool-booking-production-patch.sql на ВМ."
      );
    }
    console.error("[booking-db] insert booking_requests:", err);
    throw new BookingStorageError();
  } finally {
    client.release();
  }
}
