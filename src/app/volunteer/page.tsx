"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Gamepad2,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  User,
} from "lucide-react";
import { Game, Player, ScoreAttempt, ScoringRule } from "@/types/database";
import { PinGate } from "@/components/auth/PinGate";
import { CorrectionModal } from "@/components/volunteer/CorrectionModal";
import { evaluateAutomaticScore } from "@/services/scoring-service";

export default function VolunteerDashboardPage() {
  const [identity, setIdentity] = useState<{ code: string; name: string } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ScoreAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [scoringMethod, setScoringMethod] = useState<"manual" | "automatic">("automatic");

  // Scoring Inputs
  const [rawScore, setRawScore] = useState<string>("");
  const [manualPoints, setManualPoints] = useState<string>("");

  // Confirmation & Submission State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<ScoreAttempt | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Active Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<ScoreAttempt | null>(null);

  // Check saved volunteer identity
  useEffect(() => {
    const saved = localStorage.getItem("retro_volunteer_identity");
    if (saved) {
      try {
        setIdentity(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, gRes] = await Promise.all([
        fetch("/api/admin/players").then((r) => r.json()),
        fetch("/api/admin/games").then((r) => r.json()),
      ]);

      if (pRes.success) setPlayers(pRes.data.filter((p: Player) => p.is_active));
      if (gRes.success) {
        const activeGames = gRes.data.filter((g: Game) => g.is_active);
        setGames(activeGames);
        if (activeGames.length > 0 && !selectedGameId) {
          setSelectedGameId(activeGames[0].id);
          fetchGameRules(activeGames[0].id);
        }
      }

      fetchRecentScores();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGameRules(gameId: string) {
    try {
      const res = await fetch(`/api/admin/games/${gameId}/rules`);
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRecentScores() {
    try {
      const res = await fetch("/api/volunteer/scores");
      const data = await res.json();
      if (data.success) {
        setRecentAttempts(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleGameChange(gameId: string) {
    setSelectedGameId(gameId);
    setRawScore("");
    setManualPoints("");
    setFormError(null);
    fetchGameRules(gameId);
  }

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId),
    [games, selectedGameId]
  );

  const filteredPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return players.slice(0, 10);
    const q = playerSearchQuery.toLowerCase();
    return players
      .filter((p) => p.full_name.toLowerCase().includes(q) || p.university_roll_number.toLowerCase().includes(q))
      .slice(0, 15);
  }, [players, playerSearchQuery]);

  // Live points preview for Automatic Mode
  const automaticEval = useMemo(() => {
    if (scoringMethod !== "automatic" || !rawScore.trim()) {
      return null;
    }
    const parsed = parseInt(rawScore, 10);
    if (isNaN(parsed)) return null;
    return evaluateAutomaticScore(parsed, rules);
  }, [scoringMethod, rawScore, rules]);

  // Validate form before opening confirmation modal
  function handleInitiateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    if (!selectedPlayerId) {
      setFormError("Please select a registered player.");
      return;
    }

    if (!selectedGameId) {
      setFormError("Please select an active game.");
      return;
    }

    if (selectedGame?.scoring_status === "closed") {
      setFormError(`Scoring is currently closed for ${selectedGame.name}.`);
      return;
    }

    if (scoringMethod === "automatic") {
      const parsedScore = parseInt(rawScore, 10);
      if (isNaN(parsedScore) || parsedScore < 0) {
        setFormError("Please enter a valid non-negative raw score.");
        return;
      }

      if (!automaticEval?.success) {
        setFormError(automaticEval?.errorMessage || "Raw score does not match configured scoring rules.");
        return;
      }
    } else {
      // Manual Mode
      const parsedPoints = parseInt(manualPoints, 10);
      if (isNaN(parsedPoints) || parsedPoints < 1 || parsedPoints > 100) {
        setFormError("Awarded points must be an integer between 1 and 100.");
        return;
      }
    }

    setShowConfirmModal(true);
  }

  // Authoritative server submission
  async function handleConfirmSubmit() {
    setSubmitting(true);
    setFormError(null);

    const idempotencyKey = crypto.randomUUID();
    const finalPoints = scoringMethod === "automatic" ? automaticEval?.points : parseInt(manualPoints, 10);
    const parsedRaw = rawScore.trim() ? parseInt(rawScore, 10) : null;

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-volunteer-id": identity?.code || "vol-1",
        },
        body: JSON.stringify({
          player_id: selectedPlayerId,
          game_id: selectedGameId,
          scoring_method: scoringMethod,
          raw_score: parsedRaw,
          awarded_points: finalPoints,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Score submission rejected by server");
      }

      setSubmitSuccess(data.attempt);
      setShowConfirmModal(false);
      setRawScore("");
      setManualPoints("");
      fetchRecentScores();
    } catch (err: any) {
      setFormError(err.message);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!identity) {
    return (
      <PinGate
        role="volunteer"
        onSuccess={(ident) => {
          if (ident) setIdentity(ident);
        }}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Volunteer Mobile Header */}
      <div className="flex items-center justify-between p-4 bg-arcade-surface border border-arcade-border rounded-2xl relative overflow-hidden crt-scanlines">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-cogaan-gold/50 flex items-center justify-center p-0.5 shadow-neon">
            <Image
              src="/brand/cogaan-logo.png"
              alt="COGAAN"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">Score Entry Station</span>
              <span className="pixel-badge px-1.5 py-0.2 bg-cogaan-gold/20 text-cogaan-gold border border-cogaan-gold/40 text-[10px]">
                {identity.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Staff: <strong className="text-slate-200">{identity.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("retro_volunteer_identity");
            setIdentity(null);
          }}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-mono underline"
        >
          Change Staff
        </button>
      </div>

      {/* Main Score Submission Card */}
      <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-arcade-border/60">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cogaan-gold" />
            <h2 className="text-base font-bold text-white">Record Game Result</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Mobile Scoring</span>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5">
            <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Score Saved & Confirmed!</p>
              <p className="mt-0.5">
                Player: <strong>{submitSuccess.player?.full_name}</strong> | Game:{" "}
                <strong>{submitSuccess.game?.name}</strong> | Points:{" "}
                <strong className="text-cogaan-gold">{submitSuccess.awarded_points} pts</strong>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleInitiateSubmit} className="space-y-4">
          {/* 1. SEARCHABLE PLAYER SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              1. Select Registered Player <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div
                onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                className="w-full px-3 py-2.5 bg-arcade-card border border-arcade-border rounded-xl text-xs text-white flex items-center justify-between cursor-pointer hover:border-cogaan-gold/60 transition-colors"
              >
                {selectedPlayer ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cogaan-gold">
                      {selectedPlayer.university_roll_number}
                    </span>
                    <span className="text-slate-200">{selectedPlayer.full_name}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Tap to search player by name or roll no...</span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>

              {/* Player Search Popup */}
              {showPlayerDropdown && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-arcade-card border border-arcade-border rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type name or roll no..."
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-arcade-bg border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-cogaan-gold font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    {filteredPlayers.length === 0 ? (
                      <p className="p-2 text-center text-xs text-slate-500">
                        No registered player found. (Admin must register participants)
                      </p>
                    ) : (
                      filteredPlayers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPlayerId(p.id);
                            setShowPlayerDropdown(false);
                            setPlayerSearchQuery("");
                          }}
                          className="p-2 rounded-lg hover:bg-arcade-surface cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-white">{p.full_name}</span>
                            <span className="ml-2 font-mono text-cogaan-gold text-[11px]">
                              {p.university_roll_number}
                            </span>
                          </div>
                          {selectedPlayerId === p.id && <Check className="w-4 h-4 text-cogaan-gold" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. GAME SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              2. Select Active Tournament Game <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedGameId}
              onChange={(e) => handleGameChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-arcade-card border border-arcade-border rounded-xl text-xs text-white font-medium focus:outline-none focus:border-cogaan-gold"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id} disabled={g.scoring_status === "closed"}>
                  {g.name} {g.scoring_status !== "open" ? `(${g.scoring_status.toUpperCase()})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 3. SCORING METHOD SELECTION (Two Options) */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. Scoring Method Selection <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 2: Automatic Mode */}
              <button
                type="button"
                onClick={() => setScoringMethod("automatic")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scoringMethod === "automatic"
                    ? "bg-neon-cyan/15 border-neon-cyan shadow-cyan text-white"
                    : "bg-arcade-card/60 border-arcade-border/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="font-bold text-xs">Enter Raw Score</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Calculate Points Automatically</div>
              </button>

              {/* Option 1: Manual Mode */}
              <button
                type="button"
                onClick={() => setScoringMethod("manual")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scoringMethod === "manual"
                    ? "bg-cogaan-gold/15 border-cogaan-gold shadow-neon text-white"
                    : "bg-arcade-card/60 border-arcade-border/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="font-bold text-xs">Enter Points Directly</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Manual Mode (1 - 100)</div>
              </button>
            </div>
          </div>

          {/* 4. DYNAMIC SCORING INPUTS BASED ON METHOD */}
          {scoringMethod === "automatic" ? (
            <div className="space-y-3 p-3.5 bg-arcade-bg/80 rounded-xl border border-neon-cyan/40">
              {/* If game has no rules configured */}
              {rules.length === 0 ? (
                <div className="p-3 bg-amber-950/60 border border-amber-800 text-amber-300 rounded-xl text-xs space-y-2">
                  <p className="font-semibold">
                    No score-to-points logic configured for this game. Please use Enter Points Directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setScoringMethod("manual")}
                    className="px-3 py-1.5 bg-cogaan-gold hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors"
                  >
                    Switch to Manual Mode Now
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Enter Player Raw Score</span>
                      <span className="text-[10px] text-neon-cyan font-mono font-bold">
                        {rules.length} Active Range Rules
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="e.g., 35000"
                      value={rawScore}
                      onChange={(e) => setRawScore(e.target.value)}
                      className="w-full px-4 py-3 bg-arcade-card border border-arcade-border rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-neon-cyan"
                    />
                  </div>

                  {/* Live Points Preview Box */}
                  {rawScore.trim() && (
                    <div className="p-3 rounded-xl bg-arcade-surface border border-arcade-border/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Awarded Points Preview:</span>
                      {automaticEval?.success ? (
                        <div className="flex items-center gap-1.5 text-cogaan-gold font-mono font-black text-lg">
                          <Sparkles className="w-4 h-4 text-cogaan-gold" />
                          <span>{automaticEval.points} PTS</span>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-400 font-mono">
                          {automaticEval?.errorMessage || "Unmatched Score"}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Option 1: Manual Mode (Enter Points Directly) */
            <div className="space-y-3 p-3.5 bg-arcade-bg/80 rounded-xl border border-cogaan-gold/40">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Awarded Points (1 - 100) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  inputMode="numeric"
                  required
                  placeholder="e.g., 50"
                  value={manualPoints}
                  onChange={(e) => setManualPoints(e.target.value)}
                  className="w-full px-4 py-3 bg-arcade-card border border-arcade-border rounded-xl text-lg font-mono font-bold text-cogaan-gold focus:outline-none focus:border-cogaan-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Raw Score (Optional in Manual Mode)
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Optional game score"
                  value={rawScore}
                  onChange={(e) => setRawScore(e.target.value)}
                  className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cogaan-gold"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-cogaan-gold hover:bg-amber-400 text-black font-black text-sm rounded-xl transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>Review & Submit Score</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Confirmation Step Modal (Prevents double taps) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-arcade-surface border border-cogaan-gold/60 rounded-2xl p-6 shadow-2xl relative crt-scanlines">
            <h3 className="text-base font-bold text-white mb-2">Confirm Score Entry</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please double-check the player details before finalizing this tournament record.
            </p>

            <div className="p-3 bg-arcade-bg rounded-xl border border-arcade-border space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Player:</span>
                <span className="font-bold text-white">{selectedPlayer?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="font-mono text-cogaan-gold font-bold">
                  {selectedPlayer?.university_roll_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game:</span>
                <span className="font-bold text-white">{selectedGame?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-mono uppercase text-[11px] text-slate-300">
                  {scoringMethod}
                </span>
              </div>
              {rawScore && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Raw Score:</span>
                  <span className="font-mono text-slate-200">{rawScore}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-arcade-border/60">
                <span className="text-slate-300 font-bold">Awarded Points:</span>
                <span className="font-mono font-black text-cogaan-gold text-sm">
                  {scoringMethod === "automatic" ? automaticEval?.points : manualPoints} PTS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 bg-arcade-card hover:bg-arcade-border text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back / Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="py-2.5 px-4 bg-cogaan-gold hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-neon flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Recent Submissions List with Admin Support / Correct Score Button */}
      <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-arcade-border/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cogaan-gold" />
            <span>Your Recent Submissions ({recentAttempts.length})</span>
          </h3>
          <button
            onClick={fetchRecentScores}
            title="Refresh submissions"
            className="p-1 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No recent attempts recorded yet.</p>
          ) : (
            recentAttempts.map((att) => (
              <div
                key={att.id}
                className="p-3 bg-arcade-card/60 border border-arcade-border/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cogaan-gold text-xs">
                      {att.player?.university_roll_number}
                    </span>
                    <span className="font-medium text-xs text-white">{att.player?.full_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Game: <span className="text-slate-200">{att.game?.name}</span> •{" "}
                    {att.raw_score !== null ? `Score: ${att.raw_score}` : "Direct Manual"} •{" "}
                    <strong className="text-cogaan-gold">{att.awarded_points} pts</strong>
                  </div>
                </div>

                {/* Prominent Admin Support / Correct Score button */}
                <button
                  onClick={() => setCorrectionTarget(att)}
                  className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Support / Correct Score</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Prefilled Correction Modal */}
      {correctionTarget && (
        <CorrectionModal
          attempt={correctionTarget}
          players={players}
          games={games}
          volunteerId={identity.code}
          onClose={() => setCorrectionTarget(null)}
          onSuccess={() => {
            setCorrectionTarget(null);
            fetchRecentScores();
          }}
        />
      )}
    </div>
  );
}
