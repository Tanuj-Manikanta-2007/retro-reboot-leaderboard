import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await DataStore.updatePlayer(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update player" }, { status: 400 });
  }
}
