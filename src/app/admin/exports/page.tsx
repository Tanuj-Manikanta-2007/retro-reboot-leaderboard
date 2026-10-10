"use client";

import Link from "next/link";
import { FileSpreadsheet, ArrowLeft, Download, ShieldCheck, Database, Calendar, Users, Trophy, History } from "lucide-react";

export default function AdminExportsPage() {
  const exportsList = [
    {
      title: "Player-Wise Game Points Report (Consolidated Matrix)",
      description:
        "Every registered participant in rows, with dynamic columns for every tournament game and their official best points, concluding with overall Total Points.",
      href: "/api/admin/exports/player-points",
      icon: Trophy,
      badge: "CONSOLIDATED MATRIX",
      color: "border-cogaan-gold text-cogaan-gold",
    },
    {
      title: "Official Leaderboard Standings",
      description:
        "Final and live tournament standings ranked by total points, tie-breaker order, and number of games played.",
      href: "/api/admin/exports/leaderboard",
      icon: Trophy,
      badge: "LEADERBOARD",
      color: "border-neon-cyan text-neon-cyan",
    },
    {
      title: "Registered Players Roster",
      description:
        "Complete list of registered participants with normalized roll numbers, email addresses, contact numbers, and discovery sources.",
      href: "/api/admin/exports/players",
      icon: Users,
      badge: "ROSTER",
      color: "border-emerald-500 text-emerald-400",
    },
    {
      title: "Complete Score History Audit",
      description:
        "Granular chronological list of every score attempt recorded by volunteers, including raw scores, awarded points, scoring method, and rule versions.",
      href: "/api/admin/exports/scores",
      icon: Database,
      badge: "AUDIT LOG",
      color: "border-neon-violet text-neon-violet",
    },
    {
      title: "Volunteer Activity & Correction Audit",
      description:
        "Consolidated event log of all volunteer actions, approved corrections, rejections, and timestamped administrator decisions.",
      href: "/api/admin/exports/scores", // or volunteer activity
      icon: History,
      badge: "ACTIVITY LOG",
      color: "border-amber-500 text-amber-400",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-cogaan-gold hover:underline font-mono mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
          <span>Excel Exports & Event Data Recovery</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Download sanitized XLSX workbooks with frozen headers, automatic filters, and formula injection protection.
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportsList.map((exp, idx) => {
          const Icon = exp.icon;
          return (
            <div
              key={idx}
              className="bg-arcade-surface border border-arcade-border rounded-2xl p-6 relative overflow-hidden crt-scanlines flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`pixel-badge text-[10px] px-2 py-0.5 rounded border ${exp.color}`}>
                    {exp.badge}
                  </span>
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{exp.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{exp.description}</p>
              </div>

              <Link
                href={exp.href}
                target="_blank"
                className="w-full py-2.5 px-4 bg-arcade-card hover:bg-arcade-border border border-arcade-border text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/60 shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download XLSX Report</span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Recovery & Integrity Note */}
      <div className="p-5 bg-arcade-card/50 border border-arcade-border/80 rounded-2xl text-xs space-y-2 text-slate-400">
        <div className="flex items-center gap-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Data Sanitization & Snapshot Policy</span>
        </div>
        <p>
          • <strong>Formula Injection Protection:</strong> All string cells starting with `=`, `+`, `-`, or `@` are sanitized with leading apostrophes to protect spreadsheet viewers from formula execution vulnerabilities.
        </p>
        <p>
          • <strong>Leading Zero Preservation:</strong> University Roll Numbers and Mobile Phone Numbers are explicitly typed as string literals to prevent numerical truncation.
        </p>
        <p>
          • <strong>Recovery Snapshot:</strong> Excel exports represent point-in-time tournament snapshots. Persistent truth remains housed in PostgreSQL.
        </p>
      </div>
    </div>
  );
}
