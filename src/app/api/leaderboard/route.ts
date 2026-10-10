import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

import { isSupabaseConfigured, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const isSupa = isSupabaseConfigured();
    const supa = createAdminClient();
    const { data: directGames, error: gErr } = await supa.from("games").select("*");
    const { data: directPlayers, error: pErr } = await supa.from("players").select("*");
    const { data: directAttempts, error: aErr } = await supa.from("score_attempts").select("*");
    let gamesError = null;
    let gamesRaw: any = null;
    try {
      gamesRaw = await DataStore.getGames();
    } catch (e: any) {
      gamesError = e.message;
    }

    let lbError = null;
    let lbRaw: any = null;
    try {
      lbRaw = await DataStore.getLeaderboard();
    } catch (e: any) {
      lbError = e.message;
    }

    const responseGames = directGames && directGames.length > 0 ? directGames : gamesRaw;

    return NextResponse.json({
      success: true,
      isSupa,
      directGamesCount: directGames ? directGames.length : 0,
      directPlayersCount: directPlayers ? directPlayers.length : 0,
      directAttemptsCount: directAttempts ? directAttempts.length : 0,
      gErr,
      pErr,
      aErr,
      gamesError,
      lbError,
      debugGamesCount: gamesRaw ? gamesRaw.length : 0,
      debugLeaderboardCount: lbRaw ? lbRaw.length : 0,
      leaderboard: lbRaw,
      games: responseGames,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load leaderboard" }, { status: 500 });
  }
}
