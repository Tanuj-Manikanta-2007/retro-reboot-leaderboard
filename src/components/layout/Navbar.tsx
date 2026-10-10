"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Trophy, Gamepad2, ShieldAlert, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/volunteer", label: "Volunteer Scoring", icon: Gamepad2 },
    { href: "/admin", label: "Admin Portal", icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-arcade-border/60 bg-arcade-bg/95 backdrop-blur-md">
      {/* Event Details Micro-Banner (from poster) */}
      <div className="bg-arcade-surface/80 border-b border-arcade-border/40 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-cogaan-gold">COGAAN RETRO 2.0</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">Coding · Gaming · Animation</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="pixel-badge px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-400" /> 12TH OCT
            </span>
            <span className="pixel-badge px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> MANJEERA
            </span>
            <span className="pixel-badge px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> 9AM - 4PM
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black border border-cogaan-gold/40 flex items-center justify-center p-0.5 shadow-neon">
            <Image
              src="/brand/cogaan-logo.png"
              alt="COGAAN Logo"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white group-hover:text-cogaan-gold transition-colors">
                RETRO <span className="text-cogaan-gold">REBOOT</span>
              </span>
              <span className="text-[10px] bg-neon-violet/20 text-neon-violet px-1.5 py-0.5 rounded font-mono font-bold border border-neon-violet/30">
                2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
              ORGANIZED BY COGAAN
            </p>
          </div>
        </Link>

        {/* Desktop / Tablet Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-cogaan-gold/15 text-cogaan-gold border border-cogaan-gold/40 shadow-neon"
                    : "text-slate-300 hover:text-white hover:bg-arcade-surface border border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-cogaan-gold" : "text-slate-400")} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
