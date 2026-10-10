import { NextRequest, NextResponse } from "next/server";
import { gameSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";

export async function GET() {
  try {
    const games = await DataStore.getGames();
    return NextResponse.json({ success: true, data: games });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch games" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = gameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newGame = await DataStore.createGame({
      ...parsed.data,
      description: parsed.data.description ?? null,
    });
    return NextResponse.json({ success: true, data: newGame }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create game" }, { status: 400 });
  }
}
