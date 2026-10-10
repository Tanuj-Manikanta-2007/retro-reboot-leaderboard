"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, ArrowLeft, Check, X, ShieldAlert, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { ScoreCorrectionRequest } from "@/types/database";

export default function AdminCorrectionsPage() {
  const [requests, setRequests] = useState<ScoreCorrectionRequest[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const base = filter === "all" ? "/api/admin/corrections" : `/api/admin/corrections?status=${filter}`;
      const url = `${base}${base.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reqId: string) {
    if (!confirm("Approve this correction? The official player-game score will be updated immediately.")) return;
    setProcessingId(reqId);
    try {
      const res = await fetch(`/api/admin/corrections/${reqId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: "admin-master", reason: "Approved by Admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Correction approved and applied!");
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(reqId: string) {
    const reason = prompt("Enter rejection reason for volunteer feedback:", "Incorrect evidence provided");
    if (!reason) return;

    setProcessingId(reqId);
    try {
      const res = await fetch(`/api/admin/corrections/${reqId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: "admin-master", reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Correction request rejected.");
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-cogaan-gold hover:underline font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-amber-400" />
            <span>Score Correction Approval Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review volunteer score change requests with side-by-side original vs requested audit comparison.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-arcade-surface p-1 rounded-xl border border-arcade-border self-start sm:self-auto">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? "bg-amber-500 text-black shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={fetchRequests}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-white ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-arcade-surface rounded-2xl border border-arcade-border">
            Loading correction requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-arcade-surface rounded-2xl border border-arcade-border">
            No {filter !== "all" ? filter : ""} correction requests found in the queue.
          </div>
        ) : (
          requests.map((req) => {
            const isProcessing = processingId === req.id;
            return (
              <div
                key={req.id}
                className="bg-arcade-surface border border-arcade-border rounded-2xl p-5 shadow-lg relative overflow-hidden crt-scanlines space-y-4"
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-arcade-border/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`pixel-badge text-[10px] px-2 py-0.5 rounded ${
                        req.status === "pending"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : req.status === "approved"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      STATUS: {req.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Request ID: <span className="text-slate-300">{req.id.slice(0, 8)}...</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Submitted: {new Date(req.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Side-by-side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original Entry */}
                  <div className="p-4 bg-arcade-bg/60 border border-arcade-border/60 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Original Entry
                    </span>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Player:</span>
                      <span className="font-semibold text-white">
                        {req.original_player?.full_name} ({req.original_player?.university_roll_number})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Game:</span>
                      <span className="font-semibold text-white">{req.original_game?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-mono text-slate-300 uppercase text-[11px]">
                        {req.original_scoring_method}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Raw Score:</span>
                      <span className="font-mono text-slate-300">
                        {req.original_raw_score_snapshot !== null
                          ? req.original_raw_score_snapshot
                          : "Direct Manual"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-arcade-border/40">
                      <span className="text-slate-300 font-bold">Awarded Points:</span>
                      <span className="font-mono font-bold text-slate-300">
                        {req.original_points_snapshot} pts
                      </span>
                    </div>
                  </div>

                  {/* Right: Requested Entry */}
                  <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      Requested Correction
                    </span>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Player:</span>
                      <span className="font-semibold text-white">
                        {req.requested_player?.full_name} ({req.requested_player?.university_roll_number})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Game:</span>
                      <span className="font-semibold text-white">{req.requested_game?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-mono text-amber-300 uppercase text-[11px]">
                        {req.requested_scoring_method}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Requested Raw Score:</span>
                      <span className="font-mono text-amber-300">
                        {req.requested_raw_score !== null ? req.requested_raw_score : "Direct Manual"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-amber-800/40">
                      <span className="text-amber-300 font-bold">Requested Points:</span>
                      <span className="font-mono font-bold text-cogaan-gold text-sm">
                        {req.requested_points} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason & Volunteer attribution */}
                <div className="p-3 bg-arcade-bg/40 border border-arcade-border/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>
                      Requested by Volunteer:{" "}
                      <strong className="text-slate-200">
                        {req.volunteer?.display_name || req.requested_by}
                      </strong>
                    </span>
                    {req.reviewed_by && (
                      <span className="text-slate-400">
                        Reviewed by: <strong className="text-slate-200">{req.reviewed_by}</strong> (
                        {new Date(req.reviewed_at!).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1">
                    <strong className="text-amber-400">Volunteer Reason:</strong> {req.reason}
                  </p>
                  {req.decision_reason && (
                    <p className="text-slate-400">
                      <strong className="text-slate-300">Admin Decision Note:</strong> {req.decision_reason}
                    </p>
                  )}
                </div>

                {/* Actions (if pending) */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject Request
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve & Update Score
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
