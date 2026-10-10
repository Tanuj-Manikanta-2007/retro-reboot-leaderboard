"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Plus, ArrowLeft, Trash2, AlertCircle, Check, Play, Pause, XCircle } from "lucide-react";
import { Game, ScoringRule } from "@/types/database";

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);

  // New Game Form
  const [newGameName, setNewGameName] = useState("");
  const [newGameDesc, setNewGameDesc] = useState("");
  const [gameCreating, setGameCreating] = useState(false);

  // New Rule Form
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState("");
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [ruleSuccess, setRuleSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
        if (data.data.length > 0 && !selectedGame) {
          setSelectedGame(data.data[0]);
          fetchRules(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRules(gameId: string) {
    setRulesLoading(true);
    setRuleError(null);
    setRuleSuccess(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/rules?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRulesLoading(false);
    }
  }

  function handleSelectGame(game: Game) {
    setSelectedGame(game);
    fetchRules(game.id);
  }

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setGameCreating(true);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGameName,
          description: newGameDesc,
          scoring_status: "open",
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewGameName("");
      setNewGameDesc("");
      setGames((prev) => [data.data, ...prev.filter((g) => g.id !== data.data.id)]);
      setSelectedGame(data.data);
      fetchRules(data.data.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGameCreating(false);
    }
  }

  async function handleDeleteGame(gameId: string, gameName: string) {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${gameName}"?\n\nThis will remove the game and all associated scoring rules and score submissions.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete game");

      setGames((prev) => {
        const remaining = prev.filter((g) => g.id !== gameId);
        if (selectedGame?.id === gameId) {
          const nextGame = remaining.length > 0 ? remaining[0] : null;
          setSelectedGame(nextGame);
          if (nextGame) {
            fetchRules(nextGame.id);
          } else {
            setRules([]);
          }
        }
        return remaining;
      });
    } catch (err: any) {
      alert(err.message || "Failed to delete game");
    }
  }

  async function handleUpdateGameStatus(gameId: string, status: "open" | "paused" | "closed") {
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoring_status: status }),
      });
      if (res.ok) {
        setGames((prev) =>
          prev.map((g) => (g.id === gameId ? { ...g, scoring_status: status } : g))
        );
        if (selectedGame?.id === gameId) {
          setSelectedGame((prev) => (prev ? { ...prev, scoring_status: status } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGame) return;
    setRuleError(null);
    setRuleSuccess(null);
    setRuleSubmitting(true);

    try {
      const res = await fetch(`/api/admin/games/${selectedGame.id}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minimum_score: parseInt(minScore, 10),
          maximum_score: parseInt(maxScore, 10),
          points_awarded: parseInt(pointsAwarded, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRuleSuccess(`Rule range [${minScore} - ${maxScore} = ${pointsAwarded} pts] added successfully!`);
      setMinScore("");
      setMaxScore("");
      setPointsAwarded("");
      fetchRules(selectedGame.id);
    } catch (err: any) {
      setRuleError(err.message);
    } finally {
      setRuleSubmitting(false);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!selectedGame) return;
    if (!confirm("Are you sure you want to remove this scoring range rule?")) return;

    try {
      const res = await fetch(`/api/admin/games/${selectedGame.id}/rules?ruleId=${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRules(selectedGame.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-cogaan-gold hover:underline font-mono mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-neon-cyan" />
          <span>Games & Scoring Rules Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure tournament games, toggle scoring status, and configure deterministic score-to-points ranges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Games List & Add Game */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Game Form */}
          <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-5 crt-scanlines">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-neon-cyan" /> Add Tournament Game
            </h2>
            <form onSubmit={handleCreateGame} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Street Fighter 6"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short tournament description"
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <button
                type="submit"
                disabled={gameCreating}
                className="w-full py-2 bg-neon-cyan hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all shadow-cyan disabled:opacity-50"
              >
                {gameCreating ? "Creating..." : "Create Game"}
              </button>
            </form>
          </div>

          {/* Games Directory List */}
          <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-3">All Tournament Games ({games.length})</h2>
            <div className="space-y-2">
              {loading ? (
                <p className="text-xs text-slate-500">Loading games...</p>
              ) : games.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-arcade-border rounded-xl">
                  No games added yet. Use the form above to create your first tournament game.
                </p>
              ) : (
                games.map((game) => {
                  const isSelected = selectedGame?.id === game.id;
                  return (
                    <div
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-neon-cyan/15 border-neon-cyan shadow-cyan"
                          : "bg-arcade-card/60 border-arcade-border/60 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white">{game.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`pixel-badge text-[9px] px-1.5 py-0.5 rounded ${
                              game.scoring_status === "open"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : game.scoring_status === "paused"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}
                          >
                            {game.scoring_status.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGame(game.id, game.name);
                            }}
                            title={`Delete ${game.name}`}
                            className="p-1 hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {game.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{game.description}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Rules Configurator */}
        <div className="lg:col-span-2 space-y-6">
          {selectedGame ? (
            <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-6">
              {/* Game Control Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-arcade-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedGame.name}</h2>
                    <span
                      className={`pixel-badge text-[10px] px-2 py-0.5 rounded ${
                        selectedGame.scoring_status === "open"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : selectedGame.scoring_status === "paused"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      SCORING: {selectedGame.scoring_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedGame.description || "No description set"}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Toggles */}
                  <div className="flex items-center gap-1.5 bg-arcade-card p-1 rounded-xl border border-arcade-border">
                    <button
                      onClick={() => handleUpdateGameStatus(selectedGame.id, "open")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        selectedGame.scoring_status === "open"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Play className="w-3 h-3" /> Open
                    </button>
                    <button
                      onClick={() => handleUpdateGameStatus(selectedGame.id, "paused")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        selectedGame.scoring_status === "paused"
                          ? "bg-amber-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                    <button
                      onClick={() => handleUpdateGameStatus(selectedGame.id, "closed")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        selectedGame.scoring_status === "closed"
                          ? "bg-rose-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <XCircle className="w-3 h-3" /> Close
                    </button>
                  </div>

                  {/* Delete Game Button */}
                  <button
                    onClick={() => handleDeleteGame(selectedGame.id, selectedGame.name)}
                    title={`Delete ${selectedGame.name}`}
                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Game</span>
                  </button>
                </div>
              </div>

              {/* Scoring Rules Section */}
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">Configured Score-to-Points Ranges</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Used when volunteers select <strong>Automatic Mode (Enter Raw Score)</strong>. Note: Volunteers can always use <strong>Manual Mode (Direct Points)</strong> regardless of rules.
                  </p>
                </div>

                {/* Rules Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-arcade-card text-slate-400 border-b border-arcade-border">
                      <tr>
                        <th className="p-3 font-mono">Raw Score Min</th>
                        <th className="p-3 font-mono">Raw Score Max</th>
                        <th className="p-3 text-center">Awarded Points</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arcade-border/40">
                      {rulesLoading ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500">
                            Loading rules...
                          </td>
                        </tr>
                      ) : rules.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500">
                            No automatic scoring rules configured yet for this game.
                            <br />
                            <span className="text-[11px] text-amber-400/80">
                              (Volunteers will see prompt to use Manual Mode)
                            </span>
                          </td>
                        </tr>
                      ) : (
                        rules
                          .sort((a, b) => a.minimum_score - b.minimum_score)
                          .map((rule) => (
                            <tr key={rule.id} className="hover:bg-arcade-card/30">
                              <td className="p-3 font-mono text-slate-200">
                                {rule.minimum_score.toLocaleString()}
                              </td>
                              <td className="p-3 font-mono text-slate-200">
                                {rule.maximum_score.toLocaleString()}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-cogaan-gold">
                                {rule.points_awarded} pts
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete range rule"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add New Range Form */}
                <div className="p-4 bg-arcade-card/40 border border-arcade-border rounded-xl">
                  <h4 className="text-xs font-bold text-white mb-3">Add Score Range Rule</h4>

                  {ruleError && (
                    <div className="mb-3 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{ruleError}</span>
                    </div>
                  )}

                  {ruleSuccess && (
                    <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{ruleSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Min Score (Inclusive)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g., 5000"
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        className="w-full px-3 py-1.5 bg-arcade-bg border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Max Score (Inclusive)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g., 10000"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className="w-full px-3 py-1.5 bg-arcade-bg border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Points (1 - 100)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        placeholder="e.g., 30"
                        value={pointsAwarded}
                        onChange={(e) => setPointsAwarded(e.target.value)}
                        className="w-full px-3 py-1.5 bg-arcade-bg border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-cogaan-gold font-mono font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ruleSubmitting}
                      className="w-full py-2 bg-cogaan-gold hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-all shadow-neon disabled:opacity-50"
                    >
                      {ruleSubmitting ? "Adding..." : "Add Range"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-arcade-surface border border-arcade-border rounded-2xl p-12 text-center text-slate-500">
              Select or create a tournament game to manage its scoring rules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
