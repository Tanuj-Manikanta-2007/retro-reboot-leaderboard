import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function GET() {
  try {
    const players = await DataStore.getPlayers();
    const games = await DataStore.getGames();
    const attempts = await DataStore.getAllScoreAttempts();
    const pendingCorrections = await DataStore.getCorrectionRequests("pending");
    const activity = await DataStore.getVolunteerActivity();

    return NextResponse.json({
      success: true,
      stats: {
        totalPlayers: players.length,
        activePlayers: players.filter((p) => p.is_active).length,
        totalGames: games.length,
        activeGames: games.filter((g) => g.is_active && g.scoring_status === "open").length,
        totalAttempts: attempts.length,
        pendingCorrections: pendingCorrections.length,
        recentActivityCount: activity.length,
      },
      recentActivity: activity.slice(0, 5),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load dashboard stats" }, { status: 500 });
  }
}
