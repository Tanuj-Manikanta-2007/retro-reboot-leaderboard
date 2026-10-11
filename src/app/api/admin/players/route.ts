import { NextRequest, NextResponse } from "next/server";
import { playerSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const players = await DataStore.getPlayers();
    const response = NextResponse.json({ success: true, data: players });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = playerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newPlayer = await DataStore.createPlayer(parsed.data);
    return NextResponse.json({ success: true, data: newPlayer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to register player" }, { status: 400 });
  }
}
