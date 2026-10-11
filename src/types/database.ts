export type UserRole = 'admin' | 'volunteer';
export type ScoringMethod = 'manual' | 'automatic';
export type GameScoringStatus = 'open' | 'paused' | 'closed';
export type ScoreAttemptStatus = 'accepted' | 'flagged' | 'superseded';
export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  volunteer_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  full_name: string;
  university_roll_number: string;
  university_email?: string | null;
  mobile_number?: string | null;
  discovery_source: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  scoring_status: GameScoringStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoringRule {
  id: string;
  game_id: string;
  rule_version: number;
  minimum_score: number;
  maximum_score: number;
  points_awarded: number;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
}

export interface ScoreAttempt {
  id: string;
  player_id: string;
  game_id: string;
  volunteer_id: string;
  scoring_method: ScoringMethod;
  raw_score: number | null;
  awarded_points: number;
  scoring_rule_id?: string | null;
  rule_version?: number | null;
  idempotency_key?: string | null;
  status: ScoreAttemptStatus;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  player?: Player;
  game?: Game;
  volunteer?: Profile;
}

export interface ScoreCorrectionRequest {
  id: string;
  original_attempt_id: string;
  original_player_id: string;
  original_game_id: string;
  original_raw_score_snapshot: number | null;
  original_points_snapshot: number;
  original_scoring_method: ScoringMethod;

  requested_player_id: string;
  requested_game_id: string;
  requested_scoring_method: ScoringMethod;
  requested_raw_score: number | null;
  requested_points: number;

  reason: string;
  requested_by: string;
  status: CorrectionRequestStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  decision_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  original_attempt?: ScoreAttempt;
  original_player?: Player;
  original_game?: Game;
  requested_player?: Player;
  requested_game?: Game;
  volunteer?: Profile;
  reviewer?: Profile;
}

export interface ScoreCorrectionHistory {
  id: string;
  request_id: string;
  attempt_id: string;
  old_player_id: string;
  new_player_id: string;
  old_game_id: string;
  new_game_id: string;
  old_scoring_method: ScoringMethod;
  new_scoring_method: ScoringMethod;
  previous_raw_score: number | null;
  new_raw_score: number | null;
  previous_points: number;
  new_points: number;
  approved_by: string;
  approved_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_role_snapshot?: string | null;
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  player_id?: string | null;
  game_id?: string | null;
  volunteer_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  reason?: string | null;
  request_id?: string | null;
  created_at: string;

  // Joined
  actor?: Profile;
  player?: Player;
  game?: Game;
  volunteer?: Profile;
}

export interface EventSettings {
  id: number;
  event_name: string;
  event_room: string;
  event_date: string;
  event_time: string;
  scoring_open: boolean;
  results_published: boolean;
  admin_pin_hash: string;
  volunteer_pin_hash: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  player_id: string;
  full_name: string;
  university_roll_number: string;
  total_points: number;
  games_played: number;
  rank: number;
  game_scores?: Record<string, { raw_score: number | null; points: number }>;
}

export interface VolunteerActivityItem {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  volunteer_code: string;
  player_roll_number: string;
  player_name: string;
  game_name: string;
  action: string;
  score_change: string;
  points_change: string;
  timestamp: string;
  status: string;
  correction_details?: string;
}
