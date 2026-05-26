import { NextResponse } from "next/server";
import { getAdventureById } from "@/lib/actions/adventures";
import { getBookingConfigSafe, insertBookingRequest } from "@/lib/booking-db";
import { collectActiveWarnings, isGameFormatId } from "@/lib/booking-rules";
import type { BookingSelectionState } from "@/lib/booking-types";

type Body = {
  adventureId?: string;
  gameSystemId?: string | null;
  difficultyId?: string | null;
  playerCount?: number;
  durationHours?: number;
  adventureType?: string;
  playerNote?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
  const formatAllowed = config.formats.some((f) => f.id === atRaw && f.enabled !== false);
  if (!formatAllowed) {
    return NextResponse.json({ error: "adventureType not available for this adventure" }, { status: 400 });
  }

  const state: BookingSelectionState = {
    gameSystemId: gsid,
    difficultyId: diffId,
    playerCount: pc,
    durationHours: dh,
    adventureType: atRaw,
  };

  const warningIds = collectActiveWarnings(adventureId, config.warningRules, state);

  const systemName =
    gsid != null ? config.systems.find((s) => s.id === gsid)?.name ?? null : null;
  const difficultyName =
    diffId != null ? config.difficulties.find((d) => d.id === diffId)?.name ?? null : null;

  const payload = {
    adventureId,
    adventureTitle: adventure.title,
    gameSystemId: gsid,
    gameSystemName: systemName,
    difficultyId: diffId,
    difficultyName,
    playerCount: pc,
    durationHours: dh,
    adventureType: atRaw,
    playerNote: typeof body.playerNote === "string" ? body.playerNote.slice(0, 2000) : "",
  };

  const webhookUrl = process.env.BOOKING_NOTIFY_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          warningIds,
          warnings: warningIds
            .map((wid) => config.warnings.find((w) => w.id === wid)?.message)
            .filter(Boolean),
        }),
      });
    } catch (e) {
      console.error("[booking-requests] webhook:", e);
    }
  }

  const inserted = await insertBookingRequest({
    adventureId,
    adventureTitle: adventure.title,
    payload,
    warningIds,
    clientMeta: {
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  });

  if (!inserted && process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Could not save request" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    requestId: inserted?.id ?? null,
    warningIds,
  });
}
