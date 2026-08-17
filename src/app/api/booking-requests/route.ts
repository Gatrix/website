import { NextResponse } from "next/server";
import { getAdventureById } from "@/lib/actions/adventures";
import {
  BookingSlotConflictError,
  BookingStorageError,
  getBookingConfigSafe,
  insertBookingRequest,
} from "@/lib/booking-db";
import { collectActiveWarnings, isGameFormatId } from "@/lib/booking-rules";
import { bookingUniverseFromConfig } from "@/lib/booking-config-utils";
import { fetchBusyIntervalsForValidation } from "@/lib/booking-schedule-db";
import { validateBookingInstant } from "@/lib/booking-schedule";
import type { BookingSelectionState } from "@/lib/booking-types";
import {
  isCompleteRuPhone,
  normalizeRuPhoneDigits,
  toE164RuPhone,
} from "@/lib/phone-format";

export const dynamic = "force-dynamic";

type Body = {
  adventureId?: string;
  gameSystemId?: string | null;
  difficultyId?: string | null;
  universeId?: string | null;
  playerCount?: number;
  durationHours?: number;
  adventureType?: string;
  playerNote?: string;
  phone?: string;
  startsAt?: string;
  idempotencyKey?: string;
  company?: string;
};

type RateBucket = {
  windowStart: number;
  count: number;
};

type IdempotencyEntry = {
  requestId: string;
  warningIds: number[];
  expiresAt: number;
};

const RATE_LIMIT_WINDOW_MS = Number(process.env.BOOKING_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.BOOKING_RATE_LIMIT_MAX ?? 5);
const IDEMPOTENCY_TTL_MS = Number(process.env.BOOKING_IDEMPOTENCY_TTL_MS ?? 2 * 60 * 60 * 1000);
const IDEMPOTENCY_KEY_RE = /^[a-zA-Z0-9_-]{16,80}$/;

const globalForBookingGuards = globalThis as unknown as {
  bookingRateLimit?: Map<string, RateBucket>;
  bookingIdempotency?: Map<string, IdempotencyEntry>;
};

function rateLimitStore() {
  if (!globalForBookingGuards.bookingRateLimit) {
    globalForBookingGuards.bookingRateLimit = new Map();
  }
  return globalForBookingGuards.bookingRateLimit;
}

function idempotencyStore() {
  if (!globalForBookingGuards.bookingIdempotency) {
    globalForBookingGuards.bookingIdempotency = new Map();
  }
  return globalForBookingGuards.bookingIdempotency;
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwarded ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  if (!Number.isFinite(RATE_LIMIT_WINDOW_MS) || RATE_LIMIT_WINDOW_MS <= 0) return false;
  if (!Number.isFinite(RATE_LIMIT_MAX) || RATE_LIMIT_MAX <= 0) return false;

  const now = Date.now();
  const store = rateLimitStore();
  const current = store.get(key);
  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { windowStart: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function readIdempotency(key: string): IdempotencyEntry | null {
  const store = idempotencyStore();
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
}

function writeIdempotency(key: string, requestId: string, warningIds: number[]) {
  idempotencyStore().set(key, {
    requestId,
    warningIds,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim() && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Booking storage is not configured" }, { status: 503 });
  }

  const clientIp = getClientIp(req.headers);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Слишком много заявок. Попробуйте позже." },
      { status: 429 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const idempotencyKey =
    typeof body.idempotencyKey === "string" && IDEMPOTENCY_KEY_RE.test(body.idempotencyKey)
      ? body.idempotencyKey
      : null;
  if (idempotencyKey) {
    const previous = readIdempotency(idempotencyKey);
    if (previous) {
      return NextResponse.json({
        ok: true,
        requestId: previous.requestId,
        warningIds: previous.warningIds,
      });
    }
  }

  const adventureId = body.adventureId?.trim();
  if (!adventureId) {
    return NextResponse.json({ error: "adventureId required" }, { status: 400 });
  }

  const adventure = await getAdventureById(adventureId);
  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found" }, { status: 404 });
  }

  const config = await getBookingConfigSafe(adventure);
  const gsid = body.gameSystemId?.trim() || null;
  if (config.systems.length > 0) {
    if (gsid == null || !config.systems.some((s) => s.id === gsid)) {
      return NextResponse.json({ error: "gameSystemId required" }, { status: 400 });
    }
  }

  const diffId = body.difficultyId?.trim() || null;
  if (config.difficulties.length > 0) {
    if (diffId == null || !config.difficulties.some((d) => d.id === diffId)) {
      return NextResponse.json({ error: "difficultyId required" }, { status: 400 });
    }
  }

  const configuredUniverse = bookingUniverseFromConfig(config);
  const universeId = configuredUniverse?.id ?? null;

  const pc = body.playerCount;
  const dh = body.durationHours;
  if (typeof pc !== "number" || !Number.isFinite(pc) || !Number.isInteger(pc)) {
    return NextResponse.json({ error: "playerCount must be an integer" }, { status: 400 });
  }
  if (typeof dh !== "number" || !Number.isFinite(dh)) {
    return NextResponse.json({ error: "durationHours must be a number" }, { status: 400 });
  }

  const { bounds } = config;
  if (pc < bounds.minPlayers || pc > bounds.maxPlayers) {
    return NextResponse.json({ error: "playerCount out of bounds" }, { status: 400 });
  }
  if (dh < bounds.minDurationHours - 1e-6 || dh > bounds.maxDurationHours + 1e-6) {
    return NextResponse.json({ error: "durationHours out of bounds" }, { status: 400 });
  }

  const atRaw = body.adventureType ?? "adventure";
  if (!isGameFormatId(atRaw)) {
    return NextResponse.json({ error: "Invalid adventureType" }, { status: 400 });
  }
  const formatAllowed = config.formats.some((f) => f.id === atRaw && f.available);
  if (!formatAllowed) {
    return NextResponse.json({ error: "adventureType not available for this adventure" }, { status: 400 });
  }

  const state: BookingSelectionState = {
    gameSystemId: gsid,
    difficultyId: diffId,
    universeId,
    playerCount: pc,
    durationHours: dh,
    adventureType: atRaw,
  };

  const warningIds = collectActiveWarnings(adventureId, config.warningRules, state);

  const systemName =
    gsid != null ? config.systems.find((s) => s.id === gsid)?.name ?? null : null;
  const difficultyName =
    diffId != null ? config.difficulties.find((d) => d.id === diffId)?.name ?? null : null;
  const universeName = configuredUniverse?.name ?? null;

  const playerNote =
    typeof body.playerNote === "string" ? body.playerNote.slice(0, 2000) : "";

  const phoneDigits = normalizeRuPhoneDigits(
    typeof body.phone === "string" ? body.phone : ""
  );
  if (!isCompleteRuPhone(phoneDigits)) {
    return NextResponse.json({ error: "Укажите корректный номер телефона" }, { status: 400 });
  }
  const phone = toE164RuPhone(phoneDigits);

  const startsAtRaw = typeof body.startsAt === "string" ? body.startsAt.trim() : "";
  if (!startsAtRaw) {
    return NextResponse.json({ error: "startsAt required" }, { status: 400 });
  }

  let busy;
  try {
    const probeStart = new Date(startsAtRaw);
    const probeEnd = new Date(probeStart.getTime() + dh * 60 * 60 * 1000);
    busy = await fetchBusyIntervalsForValidation(probeStart, probeEnd);
  } catch (err) {
    console.error("[booking-requests] schedule lookup:", err);
    return NextResponse.json({ error: "Could not verify schedule" }, { status: 503 });
  }

  const slotCheck = validateBookingInstant(startsAtRaw, dh, busy);
  if (!slotCheck.ok) {
    return NextResponse.json({ error: slotCheck.error }, { status: 409 });
  }

  const warningMessages = warningIds
    .map((wid) => config.warnings.find((w) => w.id === wid)?.message)
    .filter((m): m is string => Boolean(m));

  let inserted;
  try {
    inserted = await insertBookingRequest({
      adventureId,
      adventureTitle: adventure.title,
      gameSystemId: gsid,
      gameSystemName: systemName,
      difficultyId: diffId,
      difficultyName,
      universeId,
      universeName,
      playerCount: pc,
      durationHours: dh,
      adventureType: atRaw,
      playerNote,
      phone,
      warningIds,
      warningMessages,
      startsAt: slotCheck.startsAt.toISOString(),
      endsAt: slotCheck.endsAt.toISOString(),
      clientMeta: {
        userAgent: req.headers.get("user-agent") ?? undefined,
        idempotencyKey,
      },
    });
  } catch (err) {
    if (err instanceof BookingSlotConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof BookingStorageError) {
      console.error("[booking-requests] storage:", err.message);
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  if (!inserted) {
    return NextResponse.json({ error: "Could not save request" }, { status: 503 });
  }

  if (idempotencyKey) {
    writeIdempotency(idempotencyKey, inserted.id, warningIds);
  }

  return NextResponse.json({
    ok: true,
    requestId: inserted.id,
    warningIds,
  });
}
