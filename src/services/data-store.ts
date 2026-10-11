import {
  AuditLog,
  Game,
  Player,
  Profile,
  ScoreAttempt,
  ScoreCorrectionHistory,
  ScoreCorrectionRequest,
  ScoringRule,
  VolunteerActivityItem,
} from "../types/database";
import { isSupabaseConfigured, createAdminClient } from "../lib/supabase/server";
import { calculateBestScoresPerGame, compareAttempts, evaluateAutomaticScore } from "./scoring-service";
import { normalizeRollNumber } from "../lib/utils";

// In-Memory Fallback State (Active when NEXT_PUBLIC_SUPABASE_URL is placeholder)
let memPlayers: Player[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    full_name: "Rahul Kumar",
    university_roll_number: "2026CSE001",
    university_email: "rahul.k@univ.edu",
    mobile_number: "9876543210",
    discovery_source: "Posters",
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    full_name: "Priya Sharma",
    university_roll_number: "2026CSE002",
    university_email: "priya.s@univ.edu",
    mobile_number: "9876543211",
    discovery_source: "Instagram",
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    full_name: "Arjun Reddy",
    university_roll_number: "2026ECE045",
    university_email: "arjun.r@univ.edu",
    mobile_number: "9876543212",
    discovery_source: "Friends",
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    full_name: "Ananya Iyer",
    university_roll_number: "2026AIML012",
    university_email: "ananya.i@univ.edu",
    mobile_number: "9876543213",
    discovery_source: "WhatsApp group",
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    full_name: "Vikram Seth",
    university_roll_number: "2026IT088",
    university_email: "vikram.s@univ.edu",
    mobile_number: "9876543214",
    discovery_source: "Manjeera",
    is_active: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

let memGames: Game[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Retro Tetris",
    description: "Classic 8-bit NES high-stack clearing challenge.",
    is_active: true,
    scoring_status: "open",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Pac-Man Arcade",
    description: "Retro maze dot eating and ghost chasing tournament.",
    is_active: true,
    scoring_status: "open",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Tekken Retro Clash",
    description: "Best of 3 1v1 fighting rounds. (Manual Round Points)",
    is_active: true,
    scoring_status: "open",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Super Mario Speedrun",
    description: "World 1-1 to 1-4 time trial run.",
    is_active: true,
    scoring_status: "open",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

let memScoringRules: ScoringRule[] = [
  // Retro Tetris rules
  {
    id: "r1",
    game_id: "11111111-1111-1111-1111-111111111111",
    rule_version: 1,
    minimum_score: 0,
    maximum_score: 9999,
    points_awarded: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r2",
    game_id: "11111111-1111-1111-1111-111111111111",
    rule_version: 1,
    minimum_score: 10000,
    maximum_score: 24999,
    points_awarded: 25,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r3",
    game_id: "11111111-1111-1111-1111-111111111111",
    rule_version: 1,
    minimum_score: 25000,
    maximum_score: 49999,
    points_awarded: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r4",
    game_id: "11111111-1111-1111-1111-111111111111",
    rule_version: 1,
    minimum_score: 50000,
    maximum_score: 999999,
    points_awarded: 80,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // Pac-Man Arcade rules
  {
    id: "r5",
    game_id: "22222222-2222-2222-2222-222222222222",
    rule_version: 1,
    minimum_score: 0,
    maximum_score: 4990,
    points_awarded: 15,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r6",
    game_id: "22222222-2222-2222-2222-222222222222",
    rule_version: 1,
    minimum_score: 5000,
    maximum_score: 14990,
    points_awarded: 35,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r7",
    game_id: "22222222-2222-2222-2222-222222222222",
    rule_version: 1,
    minimum_score: 15000,
    maximum_score: 999990,
    points_awarded: 70,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

let memScoreAttempts: ScoreAttempt[] = [
  {
    id: "att-1",
    player_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    game_id: "11111111-1111-1111-1111-111111111111",
    volunteer_id: "vol-1",
    scoring_method: "automatic",
    raw_score: 32000,
    awarded_points: 50,
    scoring_rule_id: "r3",
    rule_version: 1,
    status: "accepted",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "att-2",
    player_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    game_id: "22222222-2222-2222-2222-222222222222",
    volunteer_id: "vol-1",
    scoring_method: "automatic",
    raw_score: 18000,
    awarded_points: 70,
    scoring_rule_id: "r7",
    rule_version: 1,
    status: "accepted",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "att-3",
    player_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    game_id: "33333333-3333-3333-3333-333333333333",
    volunteer_id: "vol-2",
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 65,
    status: "accepted",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

let memCorrectionRequests: ScoreCorrectionRequest[] = [];
let memCorrectionHistory: ScoreCorrectionHistory[] = [];
let memAuditLogs: AuditLog[] = [];

let memProfiles: Profile[] = [
  {
    id: "b5a1e29d-eed5-4685-8136-9add7d03d77b",
    display_name: "Volunteer Station",
    role: "volunteer",
    volunteer_code: "VOL-01",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6feb3768-7f68-4bdf-b840-e7a444809389",
    display_name: "Tournament Admin",
    role: "admin",
    volunteer_code: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to populate relations on an attempt
function populateAttempt(att: ScoreAttempt): ScoreAttempt {
  const p = att.player || memPlayers.find((x) => x.id === att.player_id);
  const g = att.game || memGames.find((x) => x.id === att.game_id);
  const v =
    att.volunteer ||
    memProfiles.find((x) => x.id === att.volunteer_id || x.volunteer_code === att.volunteer_id);
  return {
    ...att,
    player: p,
    game: g,
    volunteer: v || {
      id: att.volunteer_id,
      display_name: "Unknown Volunteer",
      role: "volunteer",
      volunteer_code: "N/A",
      is_active: true,
      created_at: att.created_at || new Date().toISOString(),
      updated_at: att.updated_at || new Date().toISOString(),
    },
  };
}

// -------------------------------------------------------------
// DATA SERVICE IMPLEMENTATION
// -------------------------------------------------------------

export const DataStore = {
  async getOrCreateVolunteerProfile(params: {
    volunteerCode: string;
    displayName: string;
  }): Promise<Profile> {
    const normalizedCode = params.volunteerCode.trim().toUpperCase();
    const displayName = params.displayName.trim();

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      // Check existing profile by volunteer code
      const { data: existing } = await supa
        .from("profiles")
        .select("*")
        .eq("volunteer_code", normalizedCode)
        .maybeSingle();

      if (existing) {
        if (displayName && existing.display_name !== displayName) {
          const { data: updated } = await supa
            .from("profiles")
            .update({ display_name: displayName, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
            .select()
            .single();
          if (updated) {
            const idx = memProfiles.findIndex((p) => p.id === updated.id);
            if (idx !== -1) memProfiles[idx] = updated;
            else memProfiles.push(updated);
            return updated;
          }
        }
        return existing;
      }

      // Create new auth user and profile
      const sanitizedCode = normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email = `vol_${sanitizedCode}_${Date.now()}@retroreboot.cogaan.local`;
      const { data: userRes } = await supa.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { role: "volunteer", volunteer_code: normalizedCode, display_name: displayName },
      });

      if (userRes?.user?.id) {
        const newProfile: Profile = {
          id: userRes.user.id,
          display_name: displayName || `Volunteer ${normalizedCode}`,
          role: "volunteer",
          volunteer_code: normalizedCode,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insErr } = await supa
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!insErr && inserted) {
          const idx = memProfiles.findIndex((p) => p.id === inserted.id);
          if (idx !== -1) memProfiles[idx] = inserted;
          else memProfiles.push(inserted);
          return inserted;
        }
      }
    }

    // In-memory fallback
    const existingMem = memProfiles.find((p) => p.volunteer_code === normalizedCode);
    if (existingMem) {
      if (displayName) existingMem.display_name = displayName;
      return existingMem;
    }

    const newMemProfile: Profile = {
      id: crypto.randomUUID(),
      display_name: displayName || `Volunteer ${normalizedCode}`,
      role: "volunteer",
      volunteer_code: normalizedCode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memProfiles.push(newMemProfile);
    return newMemProfile;
  },

  async getVolunteerProfileById(idOrCode: string): Promise<Profile | null> {
    if (!idOrCode) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const query = isUuid
        ? supa.from("profiles").select("*").eq("id", idOrCode).maybeSingle()
        : supa.from("profiles").select("*").eq("volunteer_code", idOrCode.toUpperCase()).maybeSingle();
      const { data } = await query;
      if (data) return data;
    }
    return (
      memProfiles.find(
        (p) => p.id === idOrCode || (p.volunteer_code && p.volunteer_code === idOrCode.toUpperCase())
      ) || null
    );
  },

  async getPlayers(): Promise<Player[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("players").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        memPlayers = data;
        return data;
      }
    }
    return [...memPlayers];
  },

  async getPlayerById(id: string): Promise<Player | null> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("players").select("*").eq("id", id).single();
      if (data) {
        const idx = memPlayers.findIndex((p) => p.id === data.id);
        if (idx !== -1) memPlayers[idx] = data;
        else memPlayers.push(data);
        return data;
      }
    }
    return memPlayers.find((p) => p.id === id) || null;
  },

  async createPlayer(playerData: Omit<Player, "id" | "created_at" | "updated_at">): Promise<Player> {
    const normalizedRoll = normalizeRollNumber(playerData.university_roll_number);

    // Duplicate check
    const existing = memPlayers.find((p) => p.university_roll_number === normalizedRoll);
    if (existing) {
      throw new Error(`Player with Roll Number ${normalizedRoll} is already registered`);
    }

    const newPlayer: Player = {
      ...playerData,
      id: crypto.randomUUID(),
      university_roll_number: normalizedRoll,
      university_email: playerData.university_email?.trim() || "",
      mobile_number: playerData.mobile_number?.trim() || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("players").insert(newPlayer).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memPlayers.unshift(data);
        return data;
      }
    }

    memPlayers.unshift(newPlayer);
    this.logAudit({
      action_type: "player_registered",
      entity_type: "players",
      entity_id: newPlayer.id,
      player_id: newPlayer.id,
      new_values: newPlayer,
    });
    return newPlayer;
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const p = await this.getPlayerById(id);
    if (!p) throw new Error("Player not found");

    if (updates.university_roll_number) {
      updates.university_roll_number = normalizeRollNumber(updates.university_roll_number);
      const conflict = memPlayers.find((x) => x.id !== id && x.university_roll_number === updates.university_roll_number);
      if (conflict) throw new Error(`Roll Number ${updates.university_roll_number} is already in use`);
    }

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("players")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = memPlayers.findIndex((x) => x.id === id);
        if (idx !== -1) memPlayers[idx] = data;
        else memPlayers.push(data);
        return data;
      }
    }

    const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
    const index = memPlayers.findIndex((x) => x.id === id);
    if (index !== -1) memPlayers[index] = updated;

    this.logAudit({
      action_type: "player_updated",
      entity_type: "players",
      entity_id: id,
      player_id: id,
      old_values: p,
      new_values: updated,
    });
    return updated;
  },

  async getGames(): Promise<Game[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("games").select("*").order("name");
      if (!error && data) {
        memGames = data;
        return data;
      }
    }
    return [...memGames];
  },

  async getGameById(id: string): Promise<Game | null> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("games").select("*").eq("id", id).single();
      if (data) {
        const idx = memGames.findIndex((g) => g.id === data.id);
        if (idx !== -1) memGames[idx] = data;
        else memGames.push(data);
        return data;
      }
    }
    return memGames.find((g) => g.id === id) || null;
  },

  async createGame(gameData: Omit<Game, "id" | "created_at" | "updated_at">): Promise<Game> {
    const newGame: Game = {
      ...gameData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("games").insert(newGame).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memGames.push(data);
        return data;
      }
    }

    memGames.push(newGame);
    this.logAudit({
      action_type: "game_created",
      entity_type: "games",
      entity_id: newGame.id,
      game_id: newGame.id,
      new_values: newGame,
    });
    return newGame;
  },

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("games")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = memGames.findIndex((x) => x.id === id);
        if (idx !== -1) memGames[idx] = data;
        return data;
      }
    }

    const g = memGames.find((x) => x.id === id);
    if (!g) throw new Error("Game not found");
    const updated = { ...g, ...updates, updated_at: new Date().toISOString() };
    const idx = memGames.findIndex((x) => x.id === id);
    if (idx !== -1) memGames[idx] = updated;
    this.logAudit({
      action_type: "game_updated",
      entity_type: "games",
      entity_id: id,
      game_id: id,
      old_values: g,
      new_values: updated,
    });
    return updated;
  },

  async deleteGame(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      // Delete in FK dependency order for this game
      await supa.from("score_correction_history").delete().or(`old_game_id.eq.${id},new_game_id.eq.${id}`);
      await supa.from("score_correction_requests").delete().or(`original_game_id.eq.${id},requested_game_id.eq.${id}`);
      await supa.from("score_attempts").delete().eq("game_id", id);
      await supa.from("scoring_rules").delete().eq("game_id", id);
      const { error } = await supa.from("games").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }

    const g = memGames.find((x) => x.id === id);
    memGames = memGames.filter((x) => x.id !== id);
    memScoringRules = memScoringRules.filter((r) => r.game_id !== id);
    memScoreAttempts = memScoreAttempts.filter((a) => a.game_id !== id);
    memCorrectionRequests = memCorrectionRequests.filter((cr) => cr.original_game_id !== id && cr.requested_game_id !== id);
    memCorrectionHistory = memCorrectionHistory.filter((ch) => ch.old_game_id !== id && ch.new_game_id !== id);

    this.logAudit({
      action_type: "game_deleted",
      entity_type: "games",
      entity_id: id,
      game_id: id,
      old_values: g || { id },
    });
  },

  async getScoringRules(gameId?: string): Promise<ScoringRule[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa.from("scoring_rules").select("*").eq("is_active", true);
      if (gameId) q = q.eq("game_id", gameId);
      const { data } = await q;
      if (data) return data;
    }
    if (gameId) {
      return memScoringRules.filter((r) => r.game_id === gameId && r.is_active);
    }
    return memScoringRules.filter((r) => r.is_active);
  },

  async addScoringRule(rule: Omit<ScoringRule, "id" | "created_at">): Promise<ScoringRule> {
    const newRule: ScoringRule = {
      ...rule,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("scoring_rules").insert(newRule).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memScoringRules.push(data);
        return data;
      }
    }

    memScoringRules.push(newRule);
    this.logAudit({
      action_type: "scoring_rule_added",
      entity_type: "scoring_rules",
      entity_id: newRule.id,
      game_id: newRule.game_id,
      new_values: newRule,
    });
    return newRule;
  },

  async deleteScoringRule(ruleId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { error } = await supa.from("scoring_rules").delete().eq("id", ruleId);
      if (error) throw new Error(error.message);
    }

    const idx = memScoringRules.findIndex((r) => r.id === ruleId);
    if (idx !== -1) {
      const removed = memScoringRules[idx];
      memScoringRules.splice(idx, 1);
      this.logAudit({
        action_type: "scoring_rule_deleted",
        entity_type: "scoring_rules",
        entity_id: ruleId,
        game_id: removed.game_id,
        old_values: removed,
      });
    }
  },

  async submitScore(params: {
    player_id: string;
    game_id: string;
    volunteer_id: string;
    scoring_method: "manual" | "automatic";
    raw_score?: number | null;
    awarded_points?: number;
    idempotency_key: string;
  }): Promise<ScoreAttempt> {
    // Idempotency check
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data: existingSupa } = await supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*)")
        .eq("idempotency_key", params.idempotency_key)
        .maybeSingle();

      if (existingSupa) {
        return populateAttempt(existingSupa as ScoreAttempt);
      }
    }

    const existingAttempt = memScoreAttempts.find((a) => a.idempotency_key === params.idempotency_key);
    if (existingAttempt) {
      return populateAttempt(existingAttempt);
    }

    // Verify game exists and is open
    const game = await this.getGameById(params.game_id);
    if (!game || !game.is_active || game.scoring_status === "closed") {
      throw new Error(`Scoring is currently closed for ${game?.name || "this game"}`);
    }

    // Verify player exists and is active
    const player = await this.getPlayerById(params.player_id);
    if (!player || !player.is_active) {
      throw new Error("Selected player is not active or registered");
    }

    let finalPoints: number;
    let ruleId: string | null = null;
    let ruleVersion: number | null = null;

    if (params.scoring_method === "automatic") {
      if (params.raw_score === undefined || params.raw_score === null) {
        throw new Error("Raw score is required in Automatic Mode");
      }
      const activeRules = await this.getScoringRules(params.game_id);
      const evalRes = evaluateAutomaticScore(params.raw_score, activeRules);
      if (!evalRes.success || evalRes.points === undefined) {
        throw new Error(evalRes.errorMessage || "Unable to calculate points for this score");
      }
      finalPoints = evalRes.points;
      ruleId = evalRes.ruleId || null;
      ruleVersion = evalRes.ruleVersion || 1;
    } else {
      // Manual Mode
      if (!params.awarded_points || params.awarded_points < 1 || params.awarded_points > 100) {
        throw new Error("Points must be an integer between 1 and 100");
      }
      finalPoints = params.awarded_points;
    }

    // Resolve volunteer ID to verified profile
    let resolvedVolunteerId = params.volunteer_id;
    const resolvedProfile = await this.getVolunteerProfileById(params.volunteer_id);
    if (resolvedProfile) {
      resolvedVolunteerId = resolvedProfile.id;
    } else {
      const newProf = await this.getOrCreateVolunteerProfile({
        volunteerCode: params.volunteer_id,
        displayName: `Volunteer ${params.volunteer_id.toUpperCase()}`,
      });
      resolvedVolunteerId = newProf.id;
    }

    const attempt: ScoreAttempt = {
      id: crypto.randomUUID(),
      player_id: params.player_id,
      game_id: params.game_id,
      volunteer_id: resolvedVolunteerId,
      scoring_method: params.scoring_method,
      raw_score: params.raw_score !== undefined ? params.raw_score : null,
      awarded_points: finalPoints,
      scoring_rule_id: ruleId,
      rule_version: ruleVersion,
      idempotency_key: params.idempotency_key,
      status: "accepted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      player: player,
      game: game,
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      const { data, error } = await supa
        .from("score_attempts")
        .insert({
          id: attempt.id,
          player_id: attempt.player_id,
          game_id: attempt.game_id,
          volunteer_id: resolvedVolunteerId,
          scoring_method: attempt.scoring_method,
          raw_score: attempt.raw_score,
          awarded_points: attempt.awarded_points,
          scoring_rule_id: attempt.scoring_rule_id,
          rule_version: attempt.rule_version,
          idempotency_key: attempt.idempotency_key,
          status: attempt.status,
          created_at: attempt.created_at,
          updated_at: attempt.updated_at,
        })
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .single();

      if (error) {
        console.error("Supabase score_attempts insert failed:", error);
        throw new Error(`Failed to save score: ${error.message}`);
      }

      if (!data) {
        throw new Error("Score insertion returned no data");
      }

      if (data.player) attempt.player = data.player;
      if (data.game) attempt.game = data.game;
      if (data.volunteer) attempt.volunteer = data.volunteer;
    }

    memScoreAttempts.unshift(attempt);

    this.logAudit({
      action_type: "score_submitted",
      entity_type: "score_attempts",
      entity_id: attempt.id,
      player_id: attempt.player_id,
      game_id: attempt.game_id,
      volunteer_id: attempt.volunteer_id,
      new_values: attempt,
    });

    return populateAttempt(attempt);
  },

  async getRecentAttempts(volunteerId?: string, limit: number = 50): Promise<ScoreAttempt[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (volunteerId) {
        q = q.eq("volunteer_id", volunteerId);
      }

      const { data, error } = await q;
      if (!error && data) {
        return data.map((d: any) => ({
          ...d,
          volunteer: d.volunteer || {
            id: d.volunteer_id,
            display_name: "Unknown Volunteer",
            role: "volunteer",
            volunteer_code: "N/A",
            is_active: true,
            created_at: d.created_at,
            updated_at: d.updated_at,
          },
        }));
      }
    }
    let list = [...memScoreAttempts];
    if (volunteerId) {
      list = list.filter((a) => a.volunteer_id === volunteerId);
    }
    return list.slice(0, limit).map(populateAttempt);
  },

  async getAllScoreAttempts(): Promise<ScoreAttempt[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          ...d,
          volunteer: d.volunteer || {
            id: d.volunteer_id,
            display_name: "Unknown Volunteer",
            role: "volunteer",
            volunteer_code: "N/A",
            is_active: true,
            created_at: d.created_at,
            updated_at: d.updated_at,
          },
        }));
      }
    }
    return memScoreAttempts.map(populateAttempt);
  },

  async createCorrectionRequest(params: {
    original_attempt_id: string;
    requested_player_id: string;
    requested_game_id: string;
    requested_scoring_method: "manual" | "automatic";
    requested_raw_score?: number | null;
    requested_points: number;
    reason: string;
    requested_by: string;
  }): Promise<ScoreCorrectionRequest> {
    let orig: ScoreAttempt | null = null;
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("score_attempts").select("*").eq("id", params.original_attempt_id).maybeSingle();
      if (data) orig = data;
    }
    if (!orig) {
      orig = memScoreAttempts.find((a) => a.id === params.original_attempt_id) || null;
    }
    if (!orig) throw new Error("Original score attempt not found");

    // Resolve volunteer ID
    let resolvedVolunteerId = params.requested_by;
    const prof = await this.getVolunteerProfileById(resolvedVolunteerId);
    if (prof) {
      resolvedVolunteerId = prof.id;
    }

    const req: ScoreCorrectionRequest = {
      id: crypto.randomUUID(),
      original_attempt_id: orig.id,
      original_player_id: orig.player_id,
      original_game_id: orig.game_id,
      original_raw_score_snapshot: orig.raw_score,
      original_points_snapshot: orig.awarded_points,
      original_scoring_method: orig.scoring_method,

      requested_player_id: params.requested_player_id,
      requested_game_id: params.requested_game_id,
      requested_scoring_method: params.requested_scoring_method,
      requested_raw_score: params.requested_raw_score !== undefined ? params.requested_raw_score : null,
      requested_points: params.requested_points,

      reason: params.reason,
      requested_by: resolvedVolunteerId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { error } = await supa.from("score_correction_requests").insert(req);
      if (error) {
        console.error("Supabase insert score_correction_requests error:", error);
        throw new Error(`Failed to submit correction request: ${error.message}`);
      }
    }

    memCorrectionRequests.unshift(req);

    this.logAudit({
      action_type: "correction_requested",
      entity_type: "score_correction_requests",
      entity_id: req.id,
      player_id: req.requested_player_id,
      game_id: req.requested_game_id,
      volunteer_id: resolvedVolunteerId,
      reason: req.reason,
      new_values: req,
    });

    return this.populateCorrectionRequest(req);
  },

  populateCorrectionRequest(r: ScoreCorrectionRequest): ScoreCorrectionRequest {
    const v = memProfiles.find((x) => x.id === r.requested_by || x.volunteer_code === r.requested_by);
    return {
      ...r,
      original_attempt: memScoreAttempts.find((a) => a.id === r.original_attempt_id),
      original_player: memPlayers.find((p) => p.id === r.original_player_id),
      original_game: memGames.find((g) => g.id === r.original_game_id),
      requested_player: memPlayers.find((p) => p.id === r.requested_player_id),
      requested_game: memGames.find((g) => g.id === r.requested_game_id),
      volunteer: v || {
        id: r.requested_by,
        display_name: "Unknown Volunteer",
        role: "volunteer",
        volunteer_code: "N/A",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  },

  async getCorrectionRequests(status?: "pending" | "approved" | "rejected"): Promise<ScoreCorrectionRequest[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa
        .from("score_correction_requests")
        .select(`
          *,
          original_attempt:score_attempts(*),
          original_player:players!score_correction_requests_original_player_id_fkey(*),
          original_game:games!score_correction_requests_original_game_id_fkey(*),
          requested_player:players!score_correction_requests_requested_player_id_fkey(*),
          requested_game:games!score_correction_requests_requested_game_id_fkey(*),
          volunteer:profiles!score_correction_requests_requested_by_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        q = q.eq("status", status);
      }
      const { data, error } = await q;
      if (!error && data) {
        return data as ScoreCorrectionRequest[];
      }
    }

    let list = [...memCorrectionRequests];
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.map((r) => this.populateCorrectionRequest(r));
  },

  async reviewCorrectionRequest(params: {
    request_id: string;
    admin_id: string;
    decision: "approved" | "rejected";
    decision_reason?: string;
  }): Promise<ScoreCorrectionRequest> {
    let req: ScoreCorrectionRequest | null = null;
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa
        .from("score_correction_requests")
        .select("*")
        .eq("id", params.request_id)
        .maybeSingle();
      if (data) req = data;
    }
    if (!req) {
      req = memCorrectionRequests.find((r) => r.id === params.request_id) || null;
    }
    if (!req) throw new Error("Correction request not found");
    if (req.status !== "pending") throw new Error("This request has already been reviewed");

    // Resolve valid admin_id UUID for Supabase
    let supaAdminId = params.admin_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supaAdminId);
    if (!isUuid) {
      supaAdminId = "6feb3768-7f68-4bdf-b840-e7a444809389"; // registered default tournament admin profile
    }

    if (params.decision === "approved") {
      // Validate requested points
      if (req.requested_points < 1 || req.requested_points > 100) {
        throw new Error(`Requested points must be between 1 and 100 (got ${req.requested_points})`);
      }

      if (isSupabaseConfigured()) {
        const supa = createAdminClient();

        // 1. Try atomic PostgreSQL RPC if deployed
        let rpcSucceeded = false;
        try {
          const { data: rpcData, error: rpcErr } = await supa.rpc("approve_score_correction", {
            p_request_id: req.id,
            p_admin_id: supaAdminId,
            p_decision_reason: params.decision_reason || "Approved by administrator",
          });
          if (!rpcErr && rpcData?.success) {
            rpcSucceeded = true;
          }
        } catch {
          // Fall back to client transactional updates below
        }

        if (!rpcSucceeded) {
          // 2. Client-side sequential atomic updates with verification:
          // Verify still pending
          const { data: currentReq } = await supa
            .from("score_correction_requests")
            .select("*")
            .eq("id", req.id)
            .eq("status", "pending")
            .single();

          if (!currentReq) {
            throw new Error("Score correction request has already been processed or is not pending");
          }

          // Supersede all other active attempts for target player-game combination
          await supa
            .from("score_attempts")
            .update({ status: "superseded", updated_at: new Date().toISOString() })
            .eq("player_id", req.requested_player_id)
            .eq("game_id", req.requested_game_id)
            .neq("id", req.original_attempt_id)
            .eq("status", "accepted");

          // Update the target attempt as the official accepted result
          const { error: attErr } = await supa
            .from("score_attempts")
            .update({
              player_id: req.requested_player_id,
              game_id: req.requested_game_id,
              scoring_method: req.requested_scoring_method,
              raw_score: req.requested_raw_score,
              awarded_points: req.requested_points,
              status: "accepted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.original_attempt_id);

          if (attErr) {
            throw new Error(`Failed to apply score correction to attempt: ${attErr.message}`);
          }

          // Record in immutable score_correction_history
          const historyId = crypto.randomUUID();
          await supa.from("score_correction_history").insert({
            id: historyId,
            request_id: req.id,
            attempt_id: req.original_attempt_id,
            old_player_id: req.original_player_id,
            new_player_id: req.requested_player_id,
            old_game_id: req.original_game_id,
            new_game_id: req.requested_game_id,
            old_scoring_method: req.original_scoring_method,
            new_scoring_method: req.requested_scoring_method,
            previous_raw_score: req.original_raw_score_snapshot,
            new_raw_score: req.requested_raw_score,
            previous_points: req.original_points_snapshot,
            new_points: req.requested_points,
            approved_by: supaAdminId,
            approved_at: new Date().toISOString(),
          });

          // Mark request approved
          await supa
            .from("score_correction_requests")
            .update({
              status: "approved",
              reviewed_by: supaAdminId,
              reviewed_at: new Date().toISOString(),
              decision_reason: params.decision_reason || "Approved by administrator",
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.id);

          // Append to audit_logs
          await supa.from("audit_logs").insert({
            id: crypto.randomUUID(),
            actor_user_id: supaAdminId,
            actor_role_snapshot: "admin",
            action_type: "correction_approved",
            entity_type: "score_attempts",
            entity_id: req.original_attempt_id,
            player_id: req.requested_player_id,
            game_id: req.requested_game_id,
            volunteer_id: req.requested_by,
            reason: req.reason,
            request_id: req.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Sync in-memory fallback state:
      // Supersede all other attempts for target player and game
      for (const a of memScoreAttempts) {
        if (
          a.player_id === req.requested_player_id &&
          a.game_id === req.requested_game_id &&
          a.id !== req.original_attempt_id &&
          a.status === "accepted"
        ) {
          a.status = "superseded";
          a.updated_at = new Date().toISOString();
        }
      }

      const origAttemptIndex = memScoreAttempts.findIndex((a) => a.id === req.original_attempt_id);
      if (origAttemptIndex !== -1) {
        const origAttempt = memScoreAttempts[origAttemptIndex];
        const updatedAttempt: ScoreAttempt = {
          ...origAttempt,
          player_id: req.requested_player_id,
          game_id: req.requested_game_id,
          scoring_method: req.requested_scoring_method,
          raw_score: req.requested_raw_score,
          awarded_points: req.requested_points,
          status: "accepted",
          updated_at: new Date().toISOString(),
        };
        memScoreAttempts[origAttemptIndex] = updatedAttempt;
      }

      req.status = "approved";
      req.reviewed_by = params.admin_id;
      req.reviewed_at = new Date().toISOString();
      req.decision_reason = params.decision_reason || null;
      req.updated_at = new Date().toISOString();

      const historyRecord: ScoreCorrectionHistory = {
        id: crypto.randomUUID(),
        request_id: req.id,
        attempt_id: req.original_attempt_id,
        old_player_id: req.original_player_id,
        new_player_id: req.requested_player_id,
        old_game_id: req.original_game_id,
        new_game_id: req.requested_game_id,
        old_scoring_method: req.original_scoring_method,
        new_scoring_method: req.requested_scoring_method,
        previous_raw_score: req.original_raw_score_snapshot,
        new_raw_score: req.requested_raw_score,
        previous_points: req.original_points_snapshot,
        new_points: req.requested_points,
        approved_by: params.admin_id,
        approved_at: new Date().toISOString(),
      };
      memCorrectionHistory.push(historyRecord);

      this.logAudit({
        action_type: "correction_approved",
        entity_type: "score_attempts",
        entity_id: req.original_attempt_id,
        player_id: req.requested_player_id,
        game_id: req.requested_game_id,
        volunteer_id: req.requested_by,
        reason: req.reason,
        request_id: req.id,
      });
    } else {
      // Rejection
      if (isSupabaseConfigured()) {
        const supa = createAdminClient();
        await supa
          .from("score_correction_requests")
          .update({
            status: "rejected",
            reviewed_by: supaAdminId,
            reviewed_at: new Date().toISOString(),
            decision_reason: params.decision_reason || "Admin rejected correction",
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.id);

        await supa.from("audit_logs").insert({
          id: crypto.randomUUID(),
          actor_user_id: supaAdminId,
          actor_role_snapshot: "admin",
          action_type: "correction_rejected",
          entity_type: "score_correction_requests",
          entity_id: req.id,
          player_id: req.requested_player_id,
          game_id: req.requested_game_id,
          volunteer_id: req.requested_by,
          reason: params.decision_reason || "Admin rejected correction",
          request_id: req.id,
          created_at: new Date().toISOString(),
        });
      }

      req.status = "rejected";
      req.reviewed_by = params.admin_id;
      req.reviewed_at = new Date().toISOString();
      req.decision_reason = params.decision_reason || null;
      req.updated_at = new Date().toISOString();

      this.logAudit({
        action_type: "correction_rejected",
        entity_type: "score_correction_requests",
        entity_id: req.id,
        player_id: req.requested_player_id,
        game_id: req.requested_game_id,
        volunteer_id: req.requested_by,
        reason: params.decision_reason || "Admin rejected correction",
      });
    }

    return this.populateCorrectionRequest(req);
  },

  async getVolunteerActivity(): Promise<VolunteerActivityItem[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      const [attemptsRes, requestsRes] = await Promise.all([
        supa
          .from("score_attempts")
          .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
          .order("created_at", { ascending: false })
          .limit(100),
        supa
          .from("score_correction_requests")
          .select(`
            *,
            requested_player:players!score_correction_requests_requested_player_id_fkey(*),
            requested_game:games!score_correction_requests_requested_game_id_fkey(*),
            volunteer:profiles!score_correction_requests_requested_by_fkey(*)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const activities: VolunteerActivityItem[] = [];

      if (attemptsRes.data && attemptsRes.data.length > 0) {
        for (const att of attemptsRes.data) {
          activities.push({
            id: att.id,
            volunteer_id: att.volunteer_id,
            volunteer_name: att.volunteer?.display_name || "Unknown Volunteer",
            volunteer_code: att.volunteer?.volunteer_code || "N/A",
            player_roll_number: att.player?.university_roll_number || "Unknown",
            player_name: att.player?.full_name || "Unknown",
            game_name: att.game?.name || "Unknown",
            action: "Score Submitted",
            score_change: att.raw_score !== null && att.raw_score !== undefined ? String(att.raw_score) : "Direct Manual",
            points_change: `${att.awarded_points} pts`,
            timestamp: att.created_at,
            status: att.status,
          });
        }
      }

      if (requestsRes.data && requestsRes.data.length > 0) {
        for (const req of requestsRes.data) {
          activities.push({
            id: req.id,
            volunteer_id: req.requested_by,
            volunteer_name: req.volunteer?.display_name || "Unknown Volunteer",
            volunteer_code: req.volunteer?.volunteer_code || "N/A",
            player_roll_number: req.requested_player?.university_roll_number || "Unknown",
            player_name: req.requested_player?.full_name || "Unknown",
            game_name: req.requested_game?.name || "Unknown",
            action: `Correction ${req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Requested"}`,
            score_change: `${req.original_raw_score_snapshot ?? "Manual"} -> ${req.requested_raw_score ?? "Manual"}`,
            points_change: `${req.original_points_snapshot} -> ${req.requested_points} pts`,
            timestamp: req.updated_at || req.created_at,
            status: req.status,
            correction_details: `Reason: ${req.reason}${req.decision_reason ? ` | Admin note: ${req.decision_reason}` : ""}`,
          });
        }
      }

      if (activities.length > 0) {
        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }

    // In-memory fallback
    const activities: VolunteerActivityItem[] = [];

    for (const att of memScoreAttempts) {
      const p = memPlayers.find((x) => x.id === att.player_id);
      const g = memGames.find((x) => x.id === att.game_id);
      const v = memProfiles.find((x) => x.id === att.volunteer_id || x.volunteer_code === att.volunteer_id);
      activities.push({
        id: att.id,
        volunteer_id: att.volunteer_id,
        volunteer_name: v?.display_name || "Unknown Volunteer",
        volunteer_code: v?.volunteer_code || "N/A",
        player_roll_number: p?.university_roll_number || "Unknown",
        player_name: p?.full_name || "Unknown",
        game_name: g?.name || "Unknown",
        action: "Score Submitted",
        score_change: att.raw_score !== null ? String(att.raw_score) : "Direct Manual",
        points_change: `${att.awarded_points} pts`,
        timestamp: att.created_at,
        status: att.status,
      });
    }

    for (const req of memCorrectionRequests) {
      const p = memPlayers.find((x) => x.id === req.requested_player_id);
      const g = memGames.find((x) => x.id === req.requested_game_id);
      const v = memProfiles.find((x) => x.id === req.requested_by || x.volunteer_code === req.requested_by);
      activities.push({
        id: req.id,
        volunteer_id: req.requested_by,
        volunteer_name: v?.display_name || "Unknown Volunteer",
        volunteer_code: v?.volunteer_code || "N/A",
        player_roll_number: p?.university_roll_number || "Unknown",
        player_name: p?.full_name || "Unknown",
        game_name: g?.name || "Unknown",
        action: `Correction ${req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Requested"}`,
        score_change: `${req.original_raw_score_snapshot ?? "Manual"} -> ${req.requested_raw_score ?? "Manual"}`,
        points_change: `${req.original_points_snapshot} -> ${req.requested_points} pts`,
        timestamp: req.updated_at || req.created_at,
        status: req.status,
        correction_details: `Reason: ${req.reason}${req.decision_reason ? ` | Admin note: ${req.decision_reason}` : ""}`,
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getLeaderboard() {
    const players = await this.getPlayers();
    const attempts = await this.getAllScoreAttempts();

    // Only active players are eligible for public leaderboard
    const activePlayers = players.filter((p) => p.is_active);
    const playersById = new Map<string, Player>(activePlayers.map((player) => [player.id, player]));
    for (const attempt of attempts) {
      if (attempt.player && attempt.player.is_active && !playersById.has(attempt.player_id)) {
        playersById.set(attempt.player_id, attempt.player);
      }
    }

    const attemptsByPlayer = new Map<string, ScoreAttempt[]>();
    for (const att of attempts) {
      if (att.status !== "accepted") continue;
      if (!attemptsByPlayer.has(att.player_id)) {
        attemptsByPlayer.set(att.player_id, []);
      }
      attemptsByPlayer.get(att.player_id)!.push(att);
    }

    const leaderboard = Array.from(playersById.values()).map((player) => {
      const pAttempts = attemptsByPlayer.get(player.id) || [];
      const bestMap = calculateBestScoresPerGame(pAttempts);

      let totalPoints = 0;
      let earliestEntry: number | null = null;
      const gameScores: Record<string, { raw_score: number | null; points: number }> = {};

      for (const [gameId, bestAtt] of Array.from(bestMap.entries())) {
        totalPoints += bestAtt.awarded_points;
        gameScores[gameId] = {
          raw_score: bestAtt.raw_score,
          points: bestAtt.awarded_points,
        };
        const t = new Date(bestAtt.created_at).getTime();
        if (earliestEntry === null || t < earliestEntry) {
          earliestEntry = t;
        }
      }

      return {
        player_id: player.id,
        full_name: player.full_name,
        university_roll_number: player.university_roll_number,
        total_points: totalPoints,
        games_played: bestMap.size,
        game_scores: gameScores,
        earliest_entry: earliestEntry,
      };
    });

    // Sort by total points descending, then earliest entry ascending
    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      if (a.earliest_entry && b.earliest_entry) {
        return a.earliest_entry - b.earliest_entry;
      }
      return 0;
    });

    return leaderboard.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  },

  logAudit(log: Omit<AuditLog, "id" | "created_at">) {
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    memAuditLogs.unshift(newLog);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...memAuditLogs];
  },

  async flushData(options?: {
    flushScores?: boolean;
    flushPlayers?: boolean;
    flushGames?: boolean;
    flushAuditLogs?: boolean;
  }) {
    const flushScores = options?.flushScores ?? true;
    const flushPlayers = options?.flushPlayers ?? true;
    const flushGames = options?.flushGames ?? false;
    const flushAuditLogs = options?.flushAuditLogs ?? true;

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      // Delete in strict foreign-key order
      if (flushScores || flushPlayers || flushGames) {
        // 1. Correction History
        const { error: e1 } = await supa.from("score_correction_history").delete().not("id", "is", null);
        if (e1) console.warn("Supabase flush score_correction_history warning:", e1.message);

        // 2. Correction Requests
        const { error: e2 } = await supa.from("score_correction_requests").delete().not("id", "is", null);
        if (e2) console.warn("Supabase flush score_correction_requests warning:", e2.message);

        // 3. Score Attempts
        const { error: e3 } = await supa.from("score_attempts").delete().not("id", "is", null);
        if (e3) console.warn("Supabase flush score_attempts warning:", e3.message);
      }

      // 4. Audit Logs
      if (flushAuditLogs) {
        const { error: e4 } = await supa.from("audit_logs").delete().not("id", "is", null);
        if (e4) console.warn("Supabase flush audit_logs warning:", e4.message);
      }

      // 5. Players
      if (flushPlayers) {
        const { error: e5 } = await supa.from("players").delete().not("id", "is", null);
        if (e5) console.warn("Supabase flush players warning:", e5.message);
      }

      // 6. Games & Rules
      if (flushGames) {
        const { error: e6 } = await supa.from("scoring_rules").delete().not("id", "is", null);
        if (e6) console.warn("Supabase flush scoring_rules warning:", e6.message);

        const { error: e7 } = await supa.from("games").delete().not("id", "is", null);
        if (e7) console.warn("Supabase flush games warning:", e7.message);
      }
    }

    // Always clear the in-memory fallback state too
    if (flushScores || flushPlayers || flushGames) {
      memCorrectionHistory = [];
      memCorrectionRequests = [];
      memScoreAttempts = [];
    }

    if (flushAuditLogs) {
      memAuditLogs = [];
    }

    if (flushPlayers) {
      memPlayers = [];
    }

    if (flushGames) {
      memScoringRules = [];
      memGames = [];
    }

    return {
      success: true,
      flushed: {
        scores: flushScores || flushPlayers || flushGames,
        players: flushPlayers,
        games: flushGames,
        auditLogs: flushAuditLogs,
      },
    };
  },
};
