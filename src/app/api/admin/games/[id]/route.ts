import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await DataStore.updateGame(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update game" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await DataStore.deleteGame(params.id);
    return NextResponse.json({ success: true, message: "Game deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete game" }, { status: 400 });
  }
}
