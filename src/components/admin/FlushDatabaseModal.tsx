"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Check, RefreshCw, Lock, ShieldAlert } from "lucide-react";

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
  const [password, setPassword] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Frontend format check for convenience: exactly 'flush' and non-empty password
  const isFormValid = confirmText === "flush" && password.trim().length > 0;

  function handleInitiateFlush() {
    setError(null);
    if (!isFormValid) {
      if (confirmText !== "flush") {
        setError("Please enter exactly 'flush' in all lowercase in the confirmation field.");
        return;
      }
      if (!password.trim()) {
        setError("Please enter the admin flush password.");
        return;
      }
      return;
    }
    // Show explicit confirmation dialog explaining operation & impact
    setShowConfirmDialog(true);
  }

  async function handleExecuteFlush() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/flush-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-verified": typeof window !== "undefined" ? localStorage.getItem("retro_admin_verified") || "" : "",
        },
        body: JSON.stringify({
          confirmation_text: confirmText,
          password: password,
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
      setShowConfirmDialog(false);
      setConfirmText("");
      setPassword("");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setShowConfirmDialog(false);
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
                  <span>Protected Database Flush</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded border border-rose-700">
                    Admin Authenticated
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wipes test tournament data while keeping database schemas and constraints 100% intact.
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
              This removes test/dummy records so you can start tournament scoring with a clean slate. 
              <strong> All tables, foreign key constraints, and views remain intact.</strong>
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
                    Removes registered players roster and related player profiles.
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
                    Clears all submitted game attempts, corrections, and correction history.
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

          {/* Two Protected Verification Fields Immediately Above the Flush Button */}
          <div className="space-y-3 mb-5 p-3.5 bg-arcade-bg/80 border border-arcade-border/60 rounded-xl">
            {/* Field 1: Flush Confirmation Text */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Flush Confirmation Text: (Type <strong className="text-rose-400 font-mono">flush</strong>)
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="flush"
                autoComplete="off"
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border focus:border-rose-500 rounded-lg text-sm text-white font-mono focus:outline-none"
              />
            </div>

            {/* Field 2: Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Password:</span>
                <span className="text-[10px] text-slate-500 font-mono">Server Authorized</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin flush password"
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border focus:border-rose-500 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
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
              onClick={handleInitiateFlush}
              disabled={!isFormValid || loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/40 disabled:text-rose-800 disabled:border-rose-900 text-white border border-rose-500 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
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

      {/* Confirmation Dialog before Execution */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-arcade-surface border border-rose-600 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Confirm Flush Operation</h4>
                <p className="text-xs text-rose-300">Irreversible Action Warning</p>
              </div>
            </div>

            <div className="p-3 bg-arcade-card border border-arcade-border rounded-xl text-xs space-y-1.5 text-slate-300">
              <p className="font-semibold text-white">This operation will permanently purge:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {flushPlayers && <li>All registered players and rosters</li>}
                {flushScores && <li>All score attempts, corrections, and history</li>}
                {flushAuditLogs && <li>All action audit logs</li>}
                {flushGames && <li>All configured games and scoring rules</li>}
              </ul>
              <p className="text-slate-400 pt-1 text-[11px]">
                Table schemas, columns, views, and system configuration will remain untouched.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-arcade-border">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                disabled={loading}
                className="px-4 py-2 bg-arcade-card hover:bg-arcade-border text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteFlush}
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Flush...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Flush Selected Entries</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
