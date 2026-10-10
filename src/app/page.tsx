"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Gamepad2, ShieldAlert, Calendar, MapPin, Clock, ArrowRight, Sparkles, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20 border-b border-arcade-border/60">
        {/* Neon Glow Highlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cogaan-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-arcade-surface border border-cogaan-gold/40 text-xs shadow-neon">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-cogaan-gold tracking-wide">COGAAN PRESENTS</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-mono">RETRO REBOOT 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
              RETRO <span className="text-cogaan-gold">REBOOT</span>
              <br />
              <span className="text-2xl sm:text-4xl text-slate-300 font-mono font-bold tracking-widest">
                ARCADE TOURNAMENT
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Official tournament scoring and live leaderboard platform organized by{" "}
              <strong className="text-white">COGAAN</strong> (<em>Coding · Gaming · Animation</em>).
              Compete across retro classics, earn points, and climb to the top of the campus rankings!
            </p>

            {/* Event Details Badges (From Poster) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
              <div className="pixel-badge px-3 py-1.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-lg text-xs flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>DATE: 12TH OCT</span>
              </div>
              <div className="pixel-badge px-3 py-1.5 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-lg text-xs flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>ROOM: MANJEERA</span>
              </div>
              <div className="pixel-badge px-3 py-1.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded-lg text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>TIME: 9AM - 4PM</span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-4">
              <Link
                href="/leaderboard"
                className="px-6 py-3.5 bg-cogaan-gold hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl shadow-neon flex items-center gap-2 transition-all hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                <span>View Live Leaderboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/volunteer"
                className="px-6 py-3.5 bg-arcade-surface hover:bg-arcade-card border border-arcade-border text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
              >
                <Gamepad2 className="w-4 h-4 text-neon-cyan" />
                <span>Volunteer Station</span>
              </Link>

              <Link
                href="/admin"
                className="px-5 py-3.5 bg-arcade-surface/60 hover:bg-arcade-surface border border-arcade-border text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Admin Portal</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Poster Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-cogaan-gold/40 shadow-2xl shadow-cogaan-gold/20 crt-scanlines group">
              <Image
                src="/brand/retro-2.0-poster.jpg"
                alt="COGAAN Retro 2.0 Official Poster"
                width={600}
                height={800}
                className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <p className="text-[11px] font-mono font-bold text-cogaan-gold">
                  WIN EXCITING PRIZES • PLAY · CONNECT · CREATE
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  COGAAN Retro Reboot 2.0 Tournament
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Feature Cards */}
      <section className="py-12 bg-arcade-surface/40">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-arcade-surface border border-arcade-border/80 rounded-2xl crt-scanlines">
            <div className="w-10 h-10 rounded-xl bg-cogaan-gold/10 border border-cogaan-gold/30 flex items-center justify-center text-cogaan-gold mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Deterministic Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Points are evaluated with non-overlapping server rules and official best-score logic. Replaying the same game never inflates scores unfairly.
            </p>
          </div>

          <div className="p-6 bg-arcade-surface border border-arcade-border/80 rounded-2xl crt-scanlines">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan mb-3">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Dual Volunteer Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Volunteers can enter raw scores for automatic calculation or record points directly in manual mode, tailored for rapid-fire gaming rounds.
            </p>
          </div>

          <div className="p-6 bg-arcade-surface border border-arcade-border/80 rounded-2xl crt-scanlines">
            <div className="w-10 h-10 rounded-xl bg-neon-violet/10 border border-neon-violet/30 flex items-center justify-center text-neon-violet mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Accountability & Corrections</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every score attempt is permanently preserved. Any mistake requires an admin-approved correction with immutable audit trails.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
