import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Retro Reboot 2.0 | COGAAN Tournament Scoring & Leaderboard",
  description:
    "Official tournament scoring, live leaderboard, and event management platform for Retro Reboot 2.0, organized by COGAAN (Coding · Gaming · Animation).",
  icons: {
    icon: "/brand/cogaan-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-arcade-bg text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cogaan-gold selection:text-black">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-arcade-border/40 py-6 text-center text-xs text-slate-500 bg-arcade-bg">
          <p>© 2026 COGAAN — Coding · Gaming · Animation. All Rights Reserved.</p>
          <p className="mt-1 font-mono text-[11px] text-slate-600">
            Retro Reboot 2.0 • Manjeera Hall • 12th Oct 9am-4pm
          </p>
        </footer>
      </body>
    </html>
  );
}
