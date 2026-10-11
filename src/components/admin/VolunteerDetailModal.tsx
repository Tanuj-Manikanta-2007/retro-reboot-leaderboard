"use client";

import { useState, useMemo } from "react";
import { X, UserCheck, ShieldCheck, Gamepad2, Users, FileCheck2, AlertCircle, History, Filter, Search, Calendar } from "lucide-react";
import { VolunteerActivityItem } from "@/types/database";

interface VolunteerDetailModalProps {
  volunteerName: string;
  volunteerCode: string;
  volunteerId: string;
  allActivities: VolunteerActivityItem[];
  onClose: () => void;
}

export function VolunteerDetailModal({
  volunteerName,
  volunteerCode,
  volunteerId,
  allActivities,
  onClose,
}: VolunteerDetailModalProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // All activities specifically for this volunteer
  const volunteerActivities = useMemo(() => {
    return allActivities.filter((act) => {
      if (act.volunteer_id && volunteerId && act.volunteer_id === volunteerId) return true;
      if (act.volunteer_code && volunteerCode && act.volunteer_code !== "N/A" && act.volunteer_code === volunteerCode) return true;
      if (act.volunteer_name && volunteerName && act.volunteer_name === volunteerName) return true;
      return false;
    });
  }, [allActivities, volunteerId, volunteerCode, volunteerName]);

  // Compute all required volunteer statistics
  const stats = useMemo(() => {
    let totalActivities = volunteerActivities.length;
    let submissionsAttempted = 0;
    let acceptedScores = 0;
    let rejectedScores = 0;
    let correctionsSubmitted = 0;
    let correctionsApproved = 0;
    let correctionsRejected = 0;

    const distinctGames = new Set<string>();
    const distinctPlayers = new Set<string>();

    for (const act of volunteerActivities) {
      const isScore = act.action.toLowerCase().includes("score");
      const isCorrection = act.action.toLowerCase().includes("correction");

      if (isScore) {
        submissionsAttempted++;
        if (act.status === "accepted") {
          acceptedScores++;
          if (act.game_name && act.game_name !== "Unknown") distinctGames.add(act.game_name);
          if (act.player_name && act.player_name !== "Unknown") distinctPlayers.add(act.player_name);
        } else if (act.status === "flagged" || act.status === "rejected" || act.status === "superseded") {
          rejectedScores++;
        }
      }

      if (isCorrection) {
        correctionsSubmitted++;
        if (act.status === "approved") {
          correctionsApproved++;
        } else if (act.status === "rejected") {
          correctionsRejected++;
        }
      }
    }

    return {
      totalActivities,
      submissionsAttempted,
      acceptedScores,
      rejectedScores,
      correctionsSubmitted,
      correctionsApproved,
      correctionsRejected,
      distinctGamesCount: distinctGames.size,
      distinctPlayersCount: distinctPlayers.size,
    };
  }, [volunteerActivities]);

  // Filtered volunteer history
  const filteredHistory = useMemo(() => {
    return volunteerActivities.filter((act) => {
      if (filterAction !== "all" && act.action !== filterAction) return false;
      if (filterStatus !== "all" && act.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          act.player_name.toLowerCase().includes(q) ||
          act.player_roll_number.toLowerCase().includes(q) ||
          act.game_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [volunteerActivities, filterAction, filterStatus, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-arcade-surface border border-arcade-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative crt-scanlines"
        role="dialog"
        aria-modal="true"
        aria-labelledby="volunteer-stats-title"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-violet via-cogaan-gold to-neon-cyan" />

        {/* Modal Header */}
        <div className="p-6 border-b border-arcade-border/60 flex items-start justify-between gap-4 bg-arcade-card/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neon-violet/20 border border-neon-violet/40 flex items-center justify-center text-neon-violet">
              <UserCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 id="volunteer-stats-title" className="text-xl sm:text-2xl font-black text-white">
                  {volunteerName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cogaan-gold/15 border border-cogaan-gold/30 text-cogaan-gold text-xs font-mono font-bold">
                  {volunteerCode || "VOL-STAFF"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Volunteer Activity &amp; Accountability Summary
              </p>
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

        {/* 9-Metric Volunteer Statistics Dashboard Grid */}
        <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-arcade-surface">
          {/* 1. Total Activities */}
          <div className="p-3 bg-arcade-card/80 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Total Activities</div>
            <div className="text-xl font-mono font-black text-white">{stats.totalActivities}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Distinct Logs</div>
          </div>

          {/* 2. Submissions Attempted */}
          <div className="p-3 bg-arcade-card/80 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Score Attempts</div>
            <div className="text-xl font-mono font-black text-neon-cyan">{stats.submissionsAttempted}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Attempted Entries</div>
          </div>

          {/* 3. Accepted Scores */}
          <div className="p-3 bg-arcade-card/80 border border-emerald-900/40 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Accepted Scores</div>
            <div className="text-xl font-mono font-black text-emerald-300">{stats.acceptedScores}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Official Saves</div>
          </div>

          {/* 4. Rejected / Superseded */}
          <div className="p-3 bg-arcade-card/80 border border-rose-900/40 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-rose-400 mb-1">Rejected Scores</div>
            <div className="text-xl font-mono font-black text-rose-300">{stats.rejectedScores}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Superseded / Flagged</div>
          </div>

          {/* 5. Corrections Submitted */}
          <div className="p-3 bg-arcade-card/80 border border-amber-900/40 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-amber-400 mb-1">Corrections Req.</div>
            <div className="text-xl font-mono font-black text-amber-300">{stats.correctionsSubmitted}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Submitted Requests</div>
          </div>

          {/* 6. Corrections Approved */}
          <div className="p-3 bg-arcade-card/80 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Corr. Approved</div>
            <div className="text-xl font-mono font-black text-emerald-400">{stats.correctionsApproved}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Admin Approved</div>
          </div>

          {/* 7. Corrections Rejected */}
          <div className="p-3 bg-arcade-card/80 border border-arcade-border/60 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Corr. Rejected</div>
            <div className="text-xl font-mono font-black text-slate-400">{stats.correctionsRejected}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Admin Rejected</div>
          </div>

          {/* 8. Distinct Games & Players */}
          <div className="p-3 bg-arcade-card/80 border border-cogaan-gold/30 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-cogaan-gold mb-1">Coverage</div>
            <div className="text-base font-mono font-black text-white">
              {stats.distinctGamesCount} <span className="text-[10px] text-slate-400 font-normal">games</span> • {stats.distinctPlayersCount} <span className="text-[10px] text-slate-400 font-normal">players</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Accepted Coverage</div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="px-6 py-3 border-y border-arcade-border/50 flex flex-wrap items-center justify-between gap-3 bg-arcade-card/30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search player or game..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-violet"
              />
            </div>

            {/* Action filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1 bg-arcade-card border border-arcade-border rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Actions</option>
              <option value="Score Submitted">Score Submitted</option>
              <option value="Correction Requested">Correction Requested</option>
              <option value="Correction Approved">Correction Approved</option>
              <option value="Correction Rejected">Correction Rejected</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 bg-arcade-card border border-arcade-border rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="superseded">Superseded</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredHistory.length} of {volunteerActivities.length} logs
          </span>
        </div>

        {/* Activity records table */}
        <div className="p-6 pt-2 overflow-y-auto flex-1">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs bg-arcade-card/20 rounded-xl border border-arcade-border/40">
              No activity logs match the selected filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-arcade-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-arcade-card text-slate-400 font-mono text-[11px] border-b border-arcade-border">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Player</th>
                    <th className="p-2.5">Roll No</th>
                    <th className="p-2.5">Game</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Points</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arcade-border/30">
                  {filteredHistory.map((act) => (
                    <tr key={act.id} className="hover:bg-arcade-card/40 transition-colors">
                      <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="p-2.5 font-bold text-white whitespace-nowrap">{act.player_name}</td>
                      <td className="p-2.5 font-mono text-cogaan-gold whitespace-nowrap">{act.player_roll_number}</td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap">{act.game_name}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-200 whitespace-nowrap">{act.action}</td>
                      <td className="p-2.5 font-mono font-bold text-neon-cyan whitespace-nowrap">{act.points_change}</td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            act.status === "accepted" || act.status === "approved"
                              ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                              : act.status === "pending"
                              ? "bg-amber-950/70 text-amber-300 border border-amber-800"
                              : "bg-rose-950/70 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-arcade-border/60 bg-arcade-card/40 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-mono">
            * Volunteer accountability records are immutable and backed by Supabase audit trails.
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
