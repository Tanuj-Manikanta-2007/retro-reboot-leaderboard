"use client";

import { useMemo } from "react";
import { X, Trophy, Gamepad2, Award, Hash, Flame, User, Layers } from "lucide-react";
import { Game, LeaderboardEntry } from "@/types/database";

interface PlayerDetailModalProps {
  player: LeaderboardEntry | null;
  allLeaderboard: LeaderboardEntry[];
  games: Game[];
  onClose: () => void;
}

interface GameBreakdownItem {
  gameId: string;
  gameName: string;
  points: number;
  rawScore: number | null;
  gameRank: number;
  totalEligiblePlayers: number;
  isTied: boolean;
}

export function PlayerDetailModal({
  player,
  allLeaderboard,
  games,
  onClose,
}: PlayerDetailModalProps) {
  // Compute game-wise standings across all players for accurate official rank
  const gameBreakdowns = useMemo(() => {
    if (!player || !player.game_scores) return [];

    const breakdowns: GameBreakdownItem[] = [];

    // For every game that the player has an accepted result in
    for (const [gameId, score] of Object.entries(player.game_scores)) {
      if (!score || score.points === undefined || score.points <= 0) continue;

      const gameObj = games.find((g) => g.id === gameId);
      const gameName = gameObj?.name || "Tournament Game";

      // Collect all eligible players who have a score in this specific game
      const playersInGame = allLeaderboard
        .filter((p) => p.game_scores?.[gameId] && p.game_scores[gameId].points > 0)
        .map((p) => {
          const s = p.game_scores![gameId];
          return {
            playerId: p.player_id,
            points: s.points,
            rawScore: s.raw_score !== null && s.raw_score !== undefined ? s.raw_score : -1,
          };
        });

      // Sort by official best-result logic: highest points > highest raw score
      playersInGame.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.rawScore - a.rawScore;
      });

      // Compute rank with proper tie handling (Dense/Standard rank)
      let gameRank = 1;
      let isTied = false;

      for (let i = 0; i < playersInGame.length; i++) {
        const current = playersInGame[i];
        if (i > 0) {
          const prev = playersInGame[i - 1];
          if (prev.points !== current.points || prev.rawScore !== current.rawScore) {
            gameRank = i + 1;
          }
        }

        if (current.playerId === player.player_id) {
          // Check if tied with neighboring players
          const prev = i > 0 ? playersInGame[i - 1] : null;
          const next = i < playersInGame.length - 1 ? playersInGame[i + 1] : null;
          const tiedWithPrev = prev && prev.points === current.points && prev.rawScore === current.rawScore;
          const tiedWithNext = next && next.points === current.points && next.rawScore === current.rawScore;
          isTied = Boolean(tiedWithPrev || tiedWithNext);
          break;
        }
      }

      breakdowns.push({
        gameId,
        gameName,
        points: score.points,
        rawScore: score.raw_score,
        gameRank,
        totalEligiblePlayers: playersInGame.length,
        isTied,
      });
    }

    // Sort breakdowns by awarded points descending
    return breakdowns.sort((a, b) => b.points - a.points);
  }, [player, allLeaderboard, games]);

  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-arcade-surface border border-arcade-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative crt-scanlines"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-details-title"
      >
        {/* Glow Accent Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cogaan-gold via-neon-cyan to-neon-violet" />

        {/* Modal Header */}
        <div className="p-6 border-b border-arcade-border/60 flex items-start justify-between gap-4 bg-arcade-card/50">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-xl border ${
                player.rank === 1
                  ? "bg-cogaan-gold/20 text-cogaan-gold border-cogaan-gold shadow-neon"
                  : player.rank === 2
                  ? "bg-slate-300/20 text-slate-300 border-slate-400"
                  : player.rank === 3
                  ? "bg-amber-700/20 text-amber-500 border-amber-600"
                  : "bg-arcade-surface text-slate-400 border-arcade-border"
              }`}
            >
              #{player.rank}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 id="player-details-title" className="text-xl sm:text-2xl font-black text-white">
                  {player.full_name}
                </h2>
                {player.rank === 1 && <Flame className="w-5 h-5 text-cogaan-gold animate-bounce" />}
              </div>
              <div className="flex items-center gap-3 text-xs mt-1 font-mono">
                <span className="text-cogaan-gold font-bold">{player.university_roll_number}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Tournament Standing</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-arcade-border/50 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player KPI Cards */}
        <div className="p-6 pb-2 grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-arcade-card/70 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3 h-3 text-cogaan-gold" />
              <span>Overall Rank</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white">
              #{player.rank}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">of {allLeaderboard.length} players</div>
          </div>

          <div className="p-3.5 bg-arcade-card/70 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Award className="w-3 h-3 text-neon-cyan" />
              <span>Total Points</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-neon-cyan">
              {player.total_points}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">PTS (Official Best)</div>
          </div>

          <div className="p-3.5 bg-arcade-card/70 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Gamepad2 className="w-3 h-3 text-neon-violet" />
              <span>Games Played</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white">
              {player.games_played}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">of {games.length} total games</div>
          </div>
        </div>

        {/* Game Breakdown Section */}
        <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cogaan-gold" />
              <span>Official Game Performance Breakdown</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {gameBreakdowns.length} {gameBreakdowns.length === 1 ? "game" : "games"} recorded
            </span>
          </div>

          {gameBreakdowns.length === 0 ? (
            <div className="p-8 text-center bg-arcade-card/30 border border-arcade-border/40 rounded-xl text-slate-400 text-xs">
              No official accepted game scores recorded yet for this player.
            </div>
          ) : (
            <div className="space-y-2.5">
              {gameBreakdowns.map((g) => (
                <div
                  key={g.gameId}
                  className="p-4 bg-arcade-card/60 hover:bg-arcade-card border border-arcade-border/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shrink-0 mt-0.5">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{g.gameName}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                        <span>
                          Raw Score:{" "}
                          <strong className="text-slate-200">
                            {g.rawScore !== null ? g.rawScore.toLocaleString() : "Direct Points"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Game Standing */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Game Standing</div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {g.isTied ? "Tied " : ""}#{g.gameRank}{" "}
                        <span className="text-slate-500 text-[10px]">of {g.totalEligiblePlayers}</span>
                      </div>
                    </div>

                    {/* Awarded Points Badge */}
                    <div className="px-3 py-1.5 rounded-lg bg-cogaan-gold/10 border border-cogaan-gold/30 text-cogaan-gold font-mono font-black text-sm text-right shrink-0">
                      {g.points} PTS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-arcade-border/60 bg-arcade-card/40 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-mono">
            * Official scores computed using best attempt logic (Points &gt; Raw Score &gt; Timestamp)
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-arcade-border hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
