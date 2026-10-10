import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const volunteerId = searchParams.get("volunteerId") || undefined;
    const attempts = await DataStore.getRecentAttempts(volunteerId, 50);

    return NextResponse.json({ success: true, data: attempts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch scores" }, { status: 500 });
  }
}
