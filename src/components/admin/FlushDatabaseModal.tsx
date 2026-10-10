"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Check, ShieldAlert, RefreshCw } from "lucide-react";

interface FlushDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FlushDatabaseModal({ isOpen, onClose, onSuccess }: FlushDatabaseModalProps) {
  const [flushPlayers, setFlushPlayers] = useState(true);
  const [flushScores, setFlushScores] = useState(true);
  const [flushGames, setFlushGames] = useState(false);
  const [flushAuditLogs, setFlushAuditLogs] = useState(true);

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "FLUSH";

  async function handleFlush() {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/flush-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flushPlayers,
          flushScores,
          flushGames,
          flushAuditLogs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to flush database entries");
      }

      setSuccessMsg(data.message || "Database entries flushed successfully!");
      setConfirmText("");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-arcade-surface border border-rose-900/60 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Flush Database Entries</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded border border-rose-700">
                    Clean Slate
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wipes dummy test data while keeping all database schemas intact.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-arcade-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-3 mb-5 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-300">Permanent Action: </span>
              This removes test/dummy records so you can start the tournament from scratch. 
              <strong> Tables, columns, and foreign keys remain untouched.</strong>
            </div>
          </div>

          {/* Options Selection */}
          <div className="space-y-3 mb-5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Select Data to Flush:
            </label>

            <div className="space-y-2 bg-arcade-card/60 p-3.5 rounded-xl border border-arcade-border">
              {/* Option 1: Players */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={flushPlayers}
                  onChange={(e) => setFlushPlayers(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-arcade-surface text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Registered Players</div>
                  <div className="text-[11px] text-slate-400">
                    Removes all player registrations (roll numbers, emails, phone numbers).
                  </div>
                </div>
              </label>

              {/* Option 2: Scores */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-arcade-border/50">
                <input
                  type="checkbox"
                  checked={flushScores}
                  onChange={(e) => setFlushScores(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-arcade-surface text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Score Attempts & Corrections</div>
                  <div className="text-[11px] text-slate-400">
                    Clears all submitted game scores, volunteer attempt logs, and pending correction queues.
                  </div>
                </div>
              </label>

              {/* Option 3: Audit Logs */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-arcade-border/50">
                <input
                  type="checkbox"
                  checked={flushAuditLogs}
                  onChange={(e) => setFlushAuditLogs(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-arcade-surface text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Audit Trail Logs</div>
                  <div className="text-[11px] text-slate-400">
                    Clears the system action log history.
                  </div>
                </div>
              </label>

              {/* Option 4: Games & Rules (Default Unchecked) */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-arcade-border/50">
                <input
                  type="checkbox"
                  checked={flushGames}
                  onChange={(e) => setFlushGames(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-arcade-surface text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-amber-300">Games & Scoring Rules (Optional)</div>
                  <div className="text-[11px] text-slate-400">
                    Leave unchecked if you want to keep your configured games and points rules intact.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Safety Typing Guard */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Type <strong className="text-rose-400 font-mono">FLUSH</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="FLUSH"
              className="w-full px-3 py-2 bg-arcade-card border border-arcade-border focus:border-rose-500 rounded-lg text-sm text-white font-mono focus:outline-none"
            />
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 mb-4">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-arcade-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-arcade-card hover:bg-arcade-border text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFlush}
              disabled={!isConfirmed || loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/50 disabled:text-rose-800 disabled:border-rose-900 text-white border border-rose-500 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Flushing entries...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Flush Database Entries</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
