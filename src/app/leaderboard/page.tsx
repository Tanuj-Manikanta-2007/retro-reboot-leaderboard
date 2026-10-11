"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Medal, Search, RefreshCw, Gamepad2, Calendar, MapPin, Clock, Flame } from "lucide-react";
import { Game, LeaderboardEntry } from "@/types/database";
import { PlayerDetailModal } from "@/components/leaderboard/PlayerDetailModal";

type LeaderboardDisplayEntry = LeaderboardEntry & {
  game_points: number;
  game_raw_score: number | null;
  display_rank: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>("overall");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => fetchLeaderboard(true), 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLeaderboard(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
        setGames(Array.isArray(data.games) ? data.games : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  // Filter & Rank computation
  const filteredData = useMemo(() => {
    let list: LeaderboardDisplayEntry[] = leaderboard.map((item) => ({
        ...item,
        game_points: 0,
        game_raw_score: null,
        display_rank: item.rank,
      }));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.full_name.toLowerCase().includes(q) ||
          item.university_roll_number.toLowerCase().includes(q)
      );
    }

    if (selectedGameFilter !== "overall") {
      // Re-rank specifically for the selected game
      list = list
        .map((item) => {
          const gameScore = item.game_scores?.[selectedGameFilter];
          return {
            ...item,
            game_points: gameScore ? gameScore.points : 0,
            game_raw_score: gameScore ? gameScore.raw_score : null,
          };
        })
        .sort((a, b) => {
          if (b.game_points !== a.game_points) return b.game_points - a.game_points;
          const aRaw = a.game_raw_score ?? -1;
          const bRaw = b.game_raw_score ?? -1;
          return bRaw - aRaw;
        })
        .map((item, idx) => ({ ...item, display_rank: idx + 1 }));
    } else {
      list = list.map((item) => ({ ...item, display_rank: item.rank }));
    }

    return list;
  }, [leaderboard, search, selectedGameFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Tournament Hero Banner */}
      <div className="p-6 sm:p-8 bg-arcade-surface border border-arcade-border rounded-2xl relative overflow-hidden crt-scanlines">
        {/* Glow Accent */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cogaan-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="pixel-badge px-2.5 py-0.5 bg-cogaan-gold/20 text-cogaan-gold border border-cogaan-gold/40 text-xs">
                OFFICIAL LIVE LEADERBOARD
              </span>
              <span className="text-xs text-slate-400 font-mono">RETRO REBOOT 2.0</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              TOURNAMENT <span className="text-cogaan-gold">STANDINGS</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Overall score is the sum of official best points earned across each tournament game. Highest raw score & earliest accepted entries resolve ties.
            </p>

            {/* Poster Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-mono">
              <span className="px-2.5 py-1 bg-rose-950/70 text-rose-300 border border-rose-800 rounded flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" /> 12TH OCT
              </span>
              <span className="px-2.5 py-1 bg-amber-950/70 text-amber-300 border border-amber-800 rounded flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> ROOM: MANJEERA
              </span>
              <span className="px-2.5 py-1 bg-cyan-950/70 text-cyan-300 border border-cyan-800 rounded flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> 9AM - 4PM
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
            <button
              onClick={() => fetchLeaderboard(false)}
              className="px-4 py-2.5 bg-cogaan-gold hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-neon flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Scores</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              Auto-syncs with validated database submissions
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 bg-arcade-surface border border-arcade-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Game Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedGameFilter("overall")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGameFilter === "overall"
                ? "bg-cogaan-gold text-black font-bold shadow-neon"
                : "bg-arcade-card text-slate-400 hover:text-white border border-arcade-border"
            }`}
          >
            🏆 Overall Leaderboard
          </button>
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGameFilter(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedGameFilter === g.id
                  ? "bg-neon-cyan text-black font-bold shadow-cyan"
                  : "bg-arcade-card text-slate-400 hover:text-white border border-arcade-border"
              }`}
            >
              🎮 {g.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-cogaan-gold"
          />
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-arcade-surface border border-arcade-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-arcade-card/90 text-slate-400 border-b border-arcade-border font-mono">
              <tr>
                <th className="p-4 text-center w-20">Rank</th>
                <th className="p-4">Participant</th>
                <th className="p-4 font-mono">Roll Number</th>
                {selectedGameFilter === "overall" ? (
                  <>
                    <th className="p-4 text-center">Games Played</th>
                    <th className="p-4 text-right font-bold text-cogaan-gold">Total Points</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-center">Best Raw Score</th>
                    <th className="p-4 text-right font-bold text-neon-cyan">Game Points</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Loading tournament standings...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No matching player scores found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const rank = item.display_rank;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={item.player_id}
                      className={`hover:bg-arcade-card/40 transition-colors ${
                        rank === 1 ? "bg-cogaan-gold/5" : ""
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="p-4 text-center">
                        {rank === 1 ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cogaan-gold text-black font-black font-mono shadow-neon text-sm">
                            1
                          </div>
                        ) : rank === 2 ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-black font-black font-mono shadow-md text-sm">
                            2
                          </div>
                        ) : rank === 3 ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-black font-mono shadow-md text-sm">
                            3
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 font-bold">#{rank}</span>
                        )}
                      </td>

                      {/* Participant Name - Clickable button opening PlayerDetailModal */}
                      <td className="p-4 font-bold text-white text-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerForModal(item)}
                          className="flex items-center gap-2 group text-left hover:text-cogaan-gold focus:outline-none focus:underline transition-colors"
                          title="Click to view detailed score breakdown"
                        >
                          <span className="group-hover:underline underline-offset-2">{item.full_name}</span>
                          {rank === 1 && <Flame className="w-4 h-4 text-cogaan-gold animate-bounce" />}
                        </button>
                      </td>

                      {/* Roll Number */}
                      <td className="p-4 font-mono font-bold text-cogaan-gold">
                        {item.university_roll_number}
                      </td>

                      {/* Dynamic Columns based on filter */}
                      {selectedGameFilter === "overall" ? (
                        <>
                          <td className="p-4 text-center font-mono text-slate-300">
                            {item.games_played} / {games.length}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-cogaan-gold text-base">
                            {item.total_points} PTS
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-center font-mono text-slate-300">
                            {item.game_raw_score !== null ? item.game_raw_score.toLocaleString() : "Manual (Direct)"}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-neon-cyan text-base">
                            {item.game_points} PTS
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Detailed Score Breakdown Modal */}
      <PlayerDetailModal
        player={selectedPlayerForModal}
        allLeaderboard={leaderboard}
        games={games}
        onClose={() => setSelectedPlayerForModal(null)}
      />
    </div>
  );
}
