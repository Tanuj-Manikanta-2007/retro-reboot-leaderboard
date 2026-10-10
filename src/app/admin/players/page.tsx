"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, Search, ArrowLeft, Check, AlertCircle, FileSpreadsheet, ShieldAlert, Trash2 } from "lucide-react";
import { Player } from "@/types/database";
import { normalizeRollNumber } from "@/lib/utils";
import { FlushDatabaseModal } from "@/components/admin/FlushDatabaseModal";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFlushModal, setShowFlushModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [source, setSource] = useState("Instagram");

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/players");
      const data = await res.json();
      if (data.success) {
        setPlayers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          university_roll_number: rollNumber,
          university_email: email,
          mobile_number: mobile,
          discovery_source: source,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register player");
      }

      setSuccess(`Player ${data.data.full_name} (${data.data.university_roll_number}) registered successfully!`);
      setFullName("");
      setRollNumber("");
      setEmail("");
      setMobile("");
      setSource("Instagram");
      fetchPlayers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function toggleStatus(player: Player) {
    try {
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !player.is_active }),
      });
      if (res.ok) {
        fetchPlayers();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filteredPlayers = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.university_roll_number.toLowerCase().includes(q) ||
      p.university_email.toLowerCase().includes(q)
    );
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
            <Users className="w-7 h-7 text-cogaan-gold" />
            <span>Player Registrations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Admin-only player management. Volunteers cannot register players.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowFlushModal(true)}
            className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Flush Dummy Data</span>
          </button>

          <Link
            href="/api/admin/exports/players"
            target="_blank"
            className="px-4 py-2 bg-arcade-surface hover:bg-arcade-card border border-arcade-border text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Players XLSX</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Register New Player Form */}
        <div className="lg:col-span-1 bg-arcade-surface border border-arcade-border rounded-2xl p-6 relative overflow-hidden crt-scanlines">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-arcade-border/50">
            <UserPlus className="w-5 h-5 text-cogaan-gold" />
            <h2 className="text-base font-bold text-white">Register Participant</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Rahul Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-lg text-sm text-white focus:outline-none focus:border-cogaan-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                University Roll Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 2026CSE001"
                value={rollNumber}
                onChange={(e) => setRollNumber(normalizeRollNumber(e.target.value))}
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-cogaan-gold"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Automatically converted to uppercase & trimmed
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                University Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g., rahul.k@univ.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-lg text-sm text-white focus:outline-none focus:border-cogaan-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-lg text-sm text-white focus:outline-none focus:border-cogaan-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Where did you hear about us?
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-arcade-card border border-arcade-border rounded-lg text-sm text-white focus:outline-none focus:border-cogaan-gold"
              >
                <option value="Instagram">Instagram</option>
                <option value="Posters">Posters</option>
                <option value="Friends">Friends</option>
                <option value="WhatsApp group">WhatsApp group</option>
                <option value="Manjeera">Manjeera</option>
                <option value="Unexpected">Unexpected</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-2.5 px-4 bg-cogaan-gold hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-all shadow-neon disabled:opacity-50"
            >
              {formSubmitting ? "Registering..." : "Register Player"}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Players Directory */}
        <div className="lg:col-span-2 bg-arcade-surface border border-arcade-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Registered Participants</h2>
              <p className="text-xs text-slate-400">Total: {players.length} players</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-arcade-card border border-arcade-border rounded-lg text-xs text-white focus:outline-none focus:border-cogaan-gold"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-arcade-card/60 text-slate-400 border-b border-arcade-border">
                <tr>
                  <th className="p-3 font-mono">Roll Number</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3 hidden md:table-cell">Contact</th>
                  <th className="p-3 hidden lg:table-cell">Discovery</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading player directory...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No matching participants found.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-arcade-card/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-cogaan-gold">
                        {player.university_roll_number}
                      </td>
                      <td className="p-3 font-medium text-white">{player.full_name}</td>
                      <td className="p-3 hidden md:table-cell text-slate-400">
                        <div>{player.university_email}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{player.mobile_number}</div>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-slate-400">
                        {player.discovery_source}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            player.is_active
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              : "bg-rose-950/80 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {player.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleStatus(player)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            player.is_active
                              ? "bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/60"
                              : "bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60"
                          }`}
                        >
                          {player.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Flush Modal */}
      <FlushDatabaseModal
        isOpen={showFlushModal}
        onClose={() => setShowFlushModal(false)}
        onSuccess={fetchPlayers}
      />
    </div>
  );
}
