import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { DataStore } from "@/services/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const leaderboard = await DataStore.getLeaderboard();
    const games = await DataStore.getGames();

    // Sanitize fields - NEVER expose email or mobile phone to public
    const publicData = leaderboard.map((item) => ({
      rank: item.rank,
      player_id: item.player_id,
      full_name: item.full_name,
      university_roll_number: item.university_roll_number,
      total_points: item.total_points,
      games_played: item.games_played,
      game_scores: item.game_scores,
    }));

    const response = NextResponse.json({
      success: true,
      leaderboard: publicData,
      games: games.filter((g) => g.is_active),
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load leaderboard" }, { status: 500 });
  }
}
