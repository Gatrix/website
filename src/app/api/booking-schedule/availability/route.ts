import { NextResponse } from "next/server";
import { getScheduleAvailability, isScheduleTableAvailable, minBookableGameDate } from "@/lib/booking-schedule-db";
import { parseIsoDate } from "@/lib/booking-schedule";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 93;

export async function GET(req: Request) {
  if (!(await isScheduleTableAvailable())) {
    return NextResponse.json({ error: "Schedule is not configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from")?.trim() ?? "";
  const toRaw = url.searchParams.get("to")?.trim() ?? "";
  const durationRaw = url.searchParams.get("durationHours");

  const from = parseIsoDate(fromRaw);
  const to = parseIsoDate(toRaw);
  const durationHours = durationRaw != null ? Number(durationRaw) : NaN;

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "from must be <= to" }, { status: 400 });
  }
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    return NextResponse.json({ error: "durationHours must be between 1 and 24" }, { status: 400 });
  }

  const minDate = minBookableGameDate();
  if (to < minDate) {
    return NextResponse.json({
      timezone: "Asia/Krasnoyarsk",
      durationHours,
      days: [],
    });
  }

  const effectiveFrom = from < minDate ? minDate : from;

  const fromMs = Date.parse(`${effectiveFrom}T12:00:00+07:00`);
  const toMs = Date.parse(`${to}T12:00:00+07:00`);
  const rangeDays = Math.floor((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too large (max ${MAX_RANGE_DAYS} days)` }, { status: 400 });
  }

  try {
    const payload = await getScheduleAvailability({
      from: effectiveFrom,
      to,
      durationHours,
    });

    if (!payload) {
      return NextResponse.json({ error: "Schedule table is not available" }, { status: 503 });
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[booking-schedule/availability]", err);
    return NextResponse.json({ error: "Could not load schedule" }, { status: 503 });
  }
}
