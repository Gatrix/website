import { NextResponse } from "next/server";
import { getAdventureById } from "@/lib/actions/adventures";
import { getBookingConfigSafe } from "@/lib/booking-db";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const adventure = await getAdventureById(id);
  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found" }, { status: 404 });
  }

  const config = await getBookingConfigSafe(adventure);
  return NextResponse.json(config);
}
