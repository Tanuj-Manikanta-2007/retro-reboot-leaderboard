"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Gamepad2,
  Trophy,
  History,
  FileSpreadsheet,
  CheckSquare,
  ShieldCheck,
  Download,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PinGate } from "@/components/auth/PinGate";
import { FlushDatabaseModal } from "@/components/admin/FlushDatabaseModal";

export default function AdminDashboardPage() {
  const [verified, setVerified] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showFlushModal, setShowFlushModal] = useState<boolean>(false);

  useEffect(() => {
    const isSaved = localStorage.getItem("retro_admin_verified");
    if (isSaved === "true") {
      setVerified(true);
      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPlayerWise() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/exports/player-points");
      if (!res.ok) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      a.download = `Retro_Reboot_Player_Points_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Export error");
    } finally {
      setExporting(false);
    }
  }

  if (!verified) {
    return (
      <PinGate
        role="admin"
        onSuccess={() => {
          setVerified(true);
          fetchStats();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-arcade-surface border border-arcade-border rounded-2xl relative overflow-hidden crt-scanlines">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pixel-badge px-2.5 py-0.5 bg-rose-950/80 text-rose-400 border border-rose-800 text-xs">
              ADMIN CONTROL CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">Retro Reboot 2.0 • COGAAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Event Management Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage registrations, tournament games, review volunteer requests, and audit real-time tournament logs.
          </p>
        </div>

        {/* PROMINENT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Volunteer Activity Button (Mandatory Section 12 Requirement) */}
          <Link
            href="/admin/volunteer-activity"
            className="px-4 py-2.5 bg-neon-violet hover:bg-violet-600 text-white rounded-xl font-bold text-sm shadow-violet flex items-center gap-2 transition-all"
          >
            <History className="w-4 h-4" />
            <span>Volunteer Activity</span>
            <ArrowUpRight className="w-4 h-4 opacity-70" />
          </Link>

          {/* Prominent Player-Wise Excel Report Export Button (Patched Requirement) */}
          <button
            onClick={handleExportPlayerWise}
            disabled={exporting}
            className="px-4 py-2.5 bg-cogaan-gold hover:bg-amber-400 text-black rounded-xl font-bold text-sm shadow-neon flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? "Generating..." : "Export Player-Wise Excel Report"}</span>
          </button>

          <button
            onClick={() => setShowFlushModal(true)}
            title="Flush database entries (Clean slate)"
            className="px-4 py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Flush Data</span>
          </button>

          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2.5 bg-arcade-card hover:bg-arcade-border text-slate-300 rounded-xl border border-arcade-border transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-arcade-surface border border-arcade-border/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Registered Players</span>
            <Users className="w-4 h-4 text-cogaan-gold" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {loading ? "..." : stats?.totalPlayers ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats?.activePlayers ?? 0} currently active
          </p>
        </div>

        <div className="p-5 bg-arcade-surface border border-arcade-border/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Games</span>
            <Gamepad2 className="w-4 h-4 text-neon-cyan" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {loading ? "..." : stats?.activeGames ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            of {stats?.totalGames ?? 0} total games
          </p>
        </div>

        <div className="p-5 bg-arcade-surface border border-arcade-border/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Score Attempts</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {loading ? "..." : stats?.totalAttempts ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Accepted game submissions</p>
        </div>

        <div className="p-5 bg-arcade-surface border border-arcade-border/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Pending Corrections</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {loading ? "..." : stats?.pendingCorrections ?? 0}
          </div>
          <Link
            href="/admin/correction-requests"
            className="text-xs text-amber-300/80 hover:text-amber-200 underline mt-1 inline-block"
          >
            Review approval queue →
          </Link>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module 1: Players */}
        <Link
          href="/admin/players"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-cogaan-gold/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-cogaan-gold/10 border border-cogaan-gold/30 flex items-center justify-center text-cogaan-gold mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cogaan-gold transition-colors flex items-center justify-between">
            <span>Player Registrations</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cogaan-gold" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Register new participants with normalized roll numbers, manage contact records, and export roster.
          </p>
        </Link>

        {/* Module 2: Games & Rules */}
        <Link
          href="/admin/games"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-neon-cyan/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan mb-4 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors flex items-center justify-between">
            <span>Games & Scoring Rules</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-neon-cyan" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Create games, control open/pause status, and configure versioned non-overlapping score-to-points ranges.
          </p>
        </Link>

        {/* Module 3: Correction Requests Queue */}
        <Link
          href="/admin/correction-requests"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-amber-500/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
            <span>Score Correction Queue</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Review volunteer score correction requests with original vs requested side-by-side verification and atomic approvals.
          </p>
        </Link>

        {/* Module 4: Volunteer Activity Log */}
        <Link
          href="/admin/volunteer-activity"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-neon-violet/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-neon-violet/10 border border-neon-violet/30 flex items-center justify-center text-neon-violet mb-4 group-hover:scale-105 transition-transform">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-neon-violet transition-colors flex items-center justify-between">
            <span>Volunteer Activity Center</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-neon-violet" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Consolidated table of every score entered, invalid attempts, corrections, and detailed audit trails.
          </p>
        </Link>

        {/* Module 5: Excel Exports */}
        <Link
          href="/admin/exports"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-emerald-500/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
            <span>Excel Exports & Recovery</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Download all 5 XLSX reports: Player-Wise Matrix, Score History, Registrations, Leaderboard, and Volunteer Activity.
          </p>
        </Link>

        {/* Module 6: Live Public Leaderboard */}
        <Link
          href="/leaderboard"
          className="p-6 bg-arcade-surface border border-arcade-border/80 hover:border-cogaan-gold/50 rounded-2xl group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-cogaan-gold/10 border border-cogaan-gold/30 flex items-center justify-center text-cogaan-gold mb-4 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cogaan-gold transition-colors flex items-center justify-between">
            <span>Live Public Leaderboard</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cogaan-gold" />
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            View live player rankings, game breakdowns, and verify official score calculations as public viewers see them.
          </p>
        </Link>
      </div>

      {/* Database Maintenance & Flush Card */}
      <div className="p-6 bg-arcade-surface border border-rose-900/40 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mt-0.5 flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Database Clean Slate / Flush Dummy Entries</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded border border-rose-700">
                  Admin Maintenance
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Ready to start the official tournament? Flush test players, score attempts, and volunteer logs with a single click. All database tables, columns, constraints, and schemas remain 100% intact so you can enter fresh data from scratch.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFlushModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 flex-shrink-0 border border-rose-500"
          >
            <Trash2 className="w-4 h-4" />
            <span>Flush Entries</span>
          </button>
        </div>
      </div>

      {/* Interactive Modal */}
      <FlushDatabaseModal
        isOpen={showFlushModal}
        onClose={() => setShowFlushModal(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
