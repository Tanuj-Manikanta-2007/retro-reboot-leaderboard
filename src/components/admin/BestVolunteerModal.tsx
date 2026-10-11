"use client";

import { useState, useMemo } from "react";
import { X, Trophy, Medal, Award, Flame, Users, Calendar, Sparkles, Filter } from "lucide-react";
import { VolunteerActivityItem } from "@/types/database";

interface BestVolunteerModalProps {
  activities: VolunteerActivityItem[];
  onClose: () => void;
}

interface VolunteerAggregated {
  volunteerKey: string;
  volunteerName: string;
  volunteerCode: string;
  totalActivities: number;
  scoresSubmitted: number;
  scoresAccepted: number;
  correctionsRequested: number;
  correctionsApproved: number;
}

export function BestVolunteerModal({ activities, onClose }: BestVolunteerModalProps) {
  const [timeFilter, setTimeFilter] = useState<"all" | "today">("all");

  // Aggregate volunteer rankings based on distinct activities
  const { rankedVolunteers, maxCount, winners, isTie } = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const filtered = activities.filter((act) => {
      // Exclude system / unknown non-volunteer events
      if (!act.volunteer_name || act.volunteer_name === "Unknown Volunteer" || act.volunteer_name === "System") {
        return false;
      }
      if (timeFilter === "today") {
        return act.timestamp.startsWith(todayStr);
      }
      return true;
    });

    const map = new Map<string, VolunteerAggregated>();

    for (const act of filtered) {
      // Group by unique volunteer identity (code if present, or unique name)
      const key = act.volunteer_code && act.volunteer_code !== "N/A"
        ? act.volunteer_code
        : act.volunteer_id || act.volunteer_name;

      if (!map.has(key)) {
        map.set(key, {
          volunteerKey: key,
          volunteerName: act.volunteer_name,
          volunteerCode: act.volunteer_code || "VOL-STAFF",
          totalActivities: 0,
          scoresSubmitted: 0,
          scoresAccepted: 0,
          correctionsRequested: 0,
          correctionsApproved: 0,
        });
      }

      const item = map.get(key)!;
      item.totalActivities++;

      if (act.action.toLowerCase().includes("score")) {
        item.scoresSubmitted++;
        if (act.status === "accepted") {
          item.scoresAccepted++;
        }
      } else if (act.action.toLowerCase().includes("correction")) {
        item.correctionsRequested++;
        if (act.status === "approved") {
          item.correctionsApproved++;
        }
      }
    }

    const list = Array.from(map.values()).sort((a, b) => {
      if (b.totalActivities !== a.totalActivities) {
        return b.totalActivities - a.totalActivities;
      }
      return b.scoresAccepted - a.scoresAccepted;
    });

    const max = list.length > 0 ? list[0].totalActivities : 0;
    const topWinners = list.filter((v) => v.totalActivities === max && max > 0);
    const tie = topWinners.length > 1;

    return {
      rankedVolunteers: list,
      maxCount: max,
      winners: topWinners,
      isTie: tie,
    };
  }, [activities, timeFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-arcade-surface border border-arcade-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative crt-scanlines"
        role="dialog"
        aria-modal="true"
        aria-labelledby="best-volunteer-title"
      >
        {/* Glowing Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cogaan-gold via-amber-400 to-cogaan-gold shadow-neon" />

        {/* Modal Header */}
        <div className="p-6 border-b border-arcade-border/60 flex items-start justify-between gap-4 bg-arcade-card/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cogaan-gold/20 border border-cogaan-gold/40 flex items-center justify-center text-cogaan-gold shadow-neon">
              <Trophy className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 id="best-volunteer-title" className="text-xl sm:text-2xl font-black text-white">
                  Best Volunteer Recognition
                </h2>
                <Sparkles className="w-5 h-5 text-cogaan-gold" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Honoring the most active volunteer based on official audit log activity count.
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

        {/* Reporting Period Filter */}
        <div className="px-6 py-3 border-b border-arcade-border/50 flex items-center justify-between gap-4 bg-arcade-card/30">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cogaan-gold" />
            <span>Reporting Period:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                timeFilter === "all"
                  ? "bg-cogaan-gold text-black shadow-neon"
                  : "bg-arcade-card text-slate-300 hover:bg-arcade-border"
              }`}
            >
              Entire Event
            </button>
            <button
              onClick={() => setTimeFilter("today")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                timeFilter === "today"
                  ? "bg-cogaan-gold text-black shadow-neon"
                  : "bg-arcade-card text-slate-300 hover:bg-arcade-border"
              }`}
            >
              Today Only
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {rankedVolunteers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-arcade-card/20 rounded-xl border border-arcade-border/40">
              No volunteer activity records found for this period.
            </div>
          ) : (
            <>
              {/* Winner Showcase Card */}
              <div className="p-6 bg-gradient-to-br from-cogaan-gold/15 via-arcade-card to-arcade-surface border border-cogaan-gold/40 rounded-2xl relative overflow-hidden shadow-neon">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-cogaan-gold text-black font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Trophy className="w-3.5 h-3.5" />
                    {isTie ? "Tied Award Winners" : "Tournament Best Volunteer"}
                  </span>

                  <span className="text-xs font-mono font-bold text-cogaan-gold">
                    {maxCount} Total Activities
                  </span>
                </div>

                <div className="space-y-4">
                  {winners.map((winner) => (
                    <div
                      key={winner.volunteerKey}
                      className="p-4 bg-arcade-surface/90 border border-cogaan-gold/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">{winner.volunteerName}</h3>
                          <span className="px-2 py-0.5 rounded bg-cogaan-gold/15 border border-cogaan-gold/40 text-cogaan-gold font-mono text-[11px] font-bold">
                            {winner.volunteerCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Most active tournament official in event operations
                        </p>
                      </div>

                      {/* Winner Metric Breakdown */}
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-arcade-card rounded-lg text-center border border-arcade-border/60">
                          <div className="text-[10px] font-mono uppercase text-slate-400">Accepted</div>
                          <div className="text-sm font-mono font-black text-emerald-400">
                            {winner.scoresAccepted}
                          </div>
                        </div>

                        <div className="p-2.5 bg-arcade-card rounded-lg text-center border border-arcade-border/60">
                          <div className="text-[10px] font-mono uppercase text-slate-400">Corrections</div>
                          <div className="text-sm font-mono font-black text-amber-400">
                            {winner.correctionsRequested}
                          </div>
                        </div>

                        <div className="p-2.5 bg-cogaan-gold/20 rounded-lg text-center border border-cogaan-gold/40">
                          <div className="text-[10px] font-mono uppercase text-cogaan-gold font-bold">Total</div>
                          <div className="text-sm font-mono font-black text-cogaan-gold">
                            {winner.totalActivities}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next-Ranked Volunteers Leaderboard Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cogaan-gold" />
                    <span>Complete Volunteer Standings ({rankedVolunteers.length} Active)</span>
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-arcade-border/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-arcade-card text-slate-400 font-mono text-[11px] border-b border-arcade-border">
                      <tr>
                        <th className="p-3 text-center">Rank</th>
                        <th className="p-3">Volunteer Name</th>
                        <th className="p-3">Volunteer Code</th>
                        <th className="p-3 text-center">Scores Accepted</th>
                        <th className="p-3 text-center">Corrections</th>
                        <th className="p-3 text-right">Total Activities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arcade-border/30">
                      {rankedVolunteers.map((v, idx) => {
                        const rank = idx + 1;
                        const isTop = rank === 1 || (isTie && v.totalActivities === maxCount);
                        return (
                          <tr
                            key={v.volunteerKey}
                            className={`hover:bg-arcade-card/40 transition-colors ${
                              isTop ? "bg-cogaan-gold/5" : ""
                            }`}
                          >
                            <td className="p-3 text-center">
                              {isTop ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cogaan-gold text-black font-black font-mono text-xs shadow-neon">
                                  1
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 font-bold">#{rank}</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-white">{v.volunteerName}</td>
                            <td className="p-3 font-mono text-cogaan-gold text-[11px] font-bold">
                              {v.volunteerCode}
                            </td>
                            <td className="p-3 text-center font-mono text-emerald-300">
                              {v.scoresAccepted}
                            </td>
                            <td className="p-3 text-center font-mono text-amber-300">
                              {v.correctionsRequested}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-cogaan-gold text-sm">
                              {v.totalActivities}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-arcade-border/60 bg-arcade-card/40 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-mono">
            * Rankings computed deterministically from genuine database audit trails.
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
