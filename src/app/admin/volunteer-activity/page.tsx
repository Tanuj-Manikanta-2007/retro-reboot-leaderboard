"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History, ArrowLeft, Search, Filter, RefreshCw, Eye, X, FileSpreadsheet, ShieldAlert } from "lucide-react";

export default function VolunteerActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [correctionsOnly, setCorrectionsOnly] = useState(false);
  const [activeDetail, setActiveDetail] = useState<any | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/volunteer-activity?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities = activities.filter((act) => {
    if (correctionsOnly && !act.action.toLowerCase().includes("correction")) {
      return false;
    }
    if (selectedAction !== "all" && act.action !== selectedAction) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        act.player_name.toLowerCase().includes(q) ||
        act.player_roll_number.toLowerCase().includes(q) ||
        act.volunteer_name.toLowerCase().includes(q) ||
        act.game_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
            <History className="w-7 h-7 text-neon-violet" />
            <span>Consolidated Volunteer Activity Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of score submissions, corrections, volunteer accountability, and timestamps.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="px-4 py-2 bg-arcade-surface hover:bg-arcade-card border border-arcade-border text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neon-violet" />
          <span>Refresh Activity</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-arcade-surface border border-arcade-border rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player, roll no, volunteer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-violet"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-slate-300 focus:outline-none focus:border-neon-violet"
          >
            <option value="all">All Action Types</option>
            <option value="Score Submitted">Score Submitted</option>
            <option value="Correction Requested">Correction Requested</option>
            <option value="Correction Approved">Correction Approved</option>
            <option value="Correction Rejected">Correction Rejected</option>
          </select>

          {/* Checkbox: Corrections Only */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={correctionsOnly}
              onChange={(e) => setCorrectionsOnly(e.target.checked)}
              className="rounded bg-arcade-card border-arcade-border text-neon-violet focus:ring-0"
            />
            <span>Corrections Only</span>
          </label>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <strong>{filteredActivities.length}</strong> of {activities.length} records
        </span>
      </div>

      {/* Consolidated 11-Column Activity Table */}
      <div className="bg-arcade-surface border border-arcade-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-arcade-card/80 text-slate-400 border-b border-arcade-border font-mono">
              <tr>
                <th className="p-3">Volunteer</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Player Name</th>
                <th className="p-3">Game</th>
                <th className="p-3">Action</th>
                <th className="p-3">Raw Score</th>
                <th className="p-3">Points</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 hidden lg:table-cell">Correction Details</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/40">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Loading activity records...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No activity matching filters found.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-arcade-card/30 transition-colors">
                    {/* 1. Volunteer */}
                    <td className="p-3 font-semibold text-slate-200">{act.volunteer_name}</td>
                    {/* 2. Roll No */}
                    <td className="p-3 font-mono text-cogaan-gold font-bold">{act.player_roll_number}</td>
                    {/* 3. Player Name */}
                    <td className="p-3 font-medium text-white">{act.player_name}</td>
                    {/* 4. Game */}
                    <td className="p-3 text-slate-300">{act.game_name}</td>
                    {/* 5. Action */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          act.action.includes("Approved")
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : act.action.includes("Requested")
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : act.action.includes("Rejected")
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-slate-800 text-slate-200 border border-slate-700"
                        }`}
                      >
                        {act.action}
                      </span>
                    </td>
                    {/* 6. Raw Score / Change */}
                    <td className="p-3 font-mono text-slate-300">{act.score_change}</td>
                    {/* 7. Points / Change */}
                    <td className="p-3 font-mono font-bold text-cogaan-gold">{act.points_change}</td>
                    {/* 8. Timestamp */}
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    {/* 9. Status */}
                    <td className="p-3 text-center">
                      <span className="capitalize font-mono text-[11px] text-slate-300">
                        {act.status}
                      </span>
                    </td>
                    {/* 10. Correction Details */}
                    <td className="p-3 hidden lg:table-cell text-slate-400 max-w-xs truncate">
                      {act.correction_details || "—"}
                    </td>
                    {/* 11. Details Action */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveDetail(act)}
                        className="p-1 text-slate-400 hover:text-neon-violet transition-colors"
                        title="View detailed activity drawer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer / Modal (Column 11 Action) */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arcade-surface border border-neon-violet/50 rounded-2xl p-6 shadow-2xl relative crt-scanlines space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-arcade-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-neon-violet" />
                <span>Activity Record Audit</span>
              </h3>
              <button
                onClick={() => setActiveDetail(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-white">{activeDetail.action}</span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Volunteer:</span>
                <span className="font-bold text-white">{activeDetail.volunteer_name}</span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Participant:</span>
                <span className="font-bold text-white">
                  {activeDetail.player_name} ({activeDetail.player_roll_number})
                </span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Tournament Game:</span>
                <span className="font-bold text-white">{activeDetail.game_name}</span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Score / Change:</span>
                <span className="font-mono text-slate-200">{activeDetail.score_change}</span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Points Awarded:</span>
                <span className="font-mono font-bold text-cogaan-gold">
                  {activeDetail.points_change}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-arcade-card rounded-lg">
                <span className="text-slate-400">Exact Timestamp:</span>
                <span className="font-mono text-slate-300">
                  {new Date(activeDetail.timestamp).toISOString()}
                </span>
              </div>
              {activeDetail.correction_details && (
                <div className="p-2 bg-arcade-card rounded-lg">
                  <span className="text-slate-400 block mb-1">Notes / Reason:</span>
                  <p className="text-slate-200 italic">{activeDetail.correction_details}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveDetail(null)}
              className="w-full py-2 bg-arcade-card hover:bg-arcade-border text-slate-200 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
