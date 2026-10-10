"use client";

import { useState } from "react";
import { ScoreAttempt, Game, Player } from "@/types/database";
import { AlertCircle, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import { evaluateAutomaticScore } from "@/services/scoring-service";

interface CorrectionModalProps {
  attempt: ScoreAttempt;
  players: Player[];
  games: Game[];
  volunteerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CorrectionModal({
  attempt,
  players,
  games,
  volunteerId,
  onClose,
  onSuccess,
}: CorrectionModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(attempt.player_id);
  const [selectedGameId, setSelectedGameId] = useState(attempt.game_id);
  const [scoringMethod, setScoringMethod] = useState<"manual" | "automatic">(attempt.scoring_method);
  const [rawScore, setRawScore] = useState<string>(attempt.raw_score !== null ? String(attempt.raw_score) : "");
  const [points, setPoints] = useState<string>(String(attempt.awarded_points));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic calculation for automatic mode
  function handleRawScoreChange(val: string) {
    setRawScore(val);
    const parsedScore = parseInt(val, 10);
    if (!isNaN(parsedScore)) {
      // In a full setup, fetch active rules for selectedGameId
      // Or calculate preview if rules are available
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a meaningful reason explaining the score correction.");
      return;
    }

    const parsedPoints = parseInt(points, 10);
    if (isNaN(parsedPoints) || parsedPoints < 1 || parsedPoints > 100) {
      setError("Points must be an integer between 1 and 100.");
      return;
    }

    let parsedRawScore: number | null = null;
    if (scoringMethod === "automatic") {
      parsedRawScore = parseInt(rawScore, 10);
      if (isNaN(parsedRawScore) || parsedRawScore < 0) {
        setError("Raw score must be a non-negative integer in automatic mode.");
        return;
      }
    } else if (rawScore.trim()) {
      parsedRawScore = parseInt(rawScore, 10);
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-volunteer-id": volunteerId,
        },
        body: JSON.stringify({
          original_attempt_id: attempt.id,
          requested_player_id: selectedPlayerId,
          requested_game_id: selectedGameId,
          requested_scoring_method: scoringMethod,
          requested_raw_score: parsedRawScore,
          requested_points: parsedPoints,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit correction request");

      alert("Correction request submitted for Admin review. The score will update once approved.");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-arcade-surface border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden crt-scanlines">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-arcade-border">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Admin Support / Correct Score</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Values Snapshot Box */}
        <div className="mb-4 p-3 bg-arcade-bg/80 border border-arcade-border/60 rounded-xl text-xs space-y-1">
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Original Recorded Result
          </p>
          <div className="flex justify-between text-slate-300">
            <span>Player:</span>
            <span className="font-bold text-white">
              {attempt.player?.full_name} ({attempt.player?.university_roll_number})
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Game:</span>
            <span className="font-bold text-white">{attempt.game?.name}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Original Score:</span>
            <span className="font-mono text-cogaan-gold">
              {attempt.raw_score !== null ? attempt.raw_score : "Direct Manual"}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Original Points:</span>
            <span className="font-mono font-bold text-cogaan-gold">{attempt.awarded_points} pts</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Correction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Player Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Player</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.university_roll_number} - {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Game</label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scoring Method Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Scoring Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScoringMethod("manual")}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  scoringMethod === "manual"
                    ? "bg-cogaan-gold text-black border-cogaan-gold font-bold shadow-neon"
                    : "bg-arcade-card text-slate-400 border-arcade-border hover:text-white"
                }`}
              >
                Enter Points Directly
              </button>
              <button
                type="button"
                onClick={() => setScoringMethod("automatic")}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  scoringMethod === "automatic"
                    ? "bg-neon-cyan text-black border-neon-cyan font-bold shadow-cyan"
                    : "bg-arcade-card text-slate-400 border-arcade-border hover:text-white"
                }`}
              >
                Enter Raw Score
              </button>
            </div>
          </div>

          {/* Score & Points Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Corrected Raw Score {scoringMethod === "manual" && "(Optional)"}
              </label>
              <input
                type="number"
                min="0"
                placeholder={scoringMethod === "automatic" ? "Required" : "Optional"}
                value={rawScore}
                onChange={(e) => handleRawScoreChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Corrected Points (1-100) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                placeholder="1 - 100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white font-mono font-bold focus:outline-none focus:border-cogaan-gold"
              />
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reason for Correction <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Typo during fast entry. Raw score was 35000 not 5000."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-arcade-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-arcade-card hover:bg-arcade-border text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Correction Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
