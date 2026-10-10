import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults if empty body
    }

    const {
      flushScores = true,
      flushPlayers = true,
      flushGames = false,
      flushAuditLogs = true,
    } = body;

    const result = await DataStore.flushData({
      flushScores,
      flushPlayers,
      flushGames,
      flushAuditLogs,
    });

    return NextResponse.json({
      success: true,
      message: "Database entries flushed successfully. Table schemas and configuration remain intact.",
      flushed: result.flushed,
    });
  } catch (err: any) {
    console.error("Flush data API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to flush database entries" },
      { status: 500 }
    );
  }
}
