-- ==============================================================================
-- RETRO REBOOT BY COGAAN (RETRO 2.0) - DATABASE MIGRATION
-- Production Schema: Schema, Indexes, RLS Policies, Deterministic Best Score Views
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Associated with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer')),
    volunteer_code TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PLAYERS TABLE (Admin-only creation, unique roll numbers)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    university_roll_number TEXT NOT NULL UNIQUE,
    university_email TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    discovery_source TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. GAMES TABLE
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    scoring_status TEXT NOT NULL CHECK (scoring_status IN ('open', 'paused', 'closed')) DEFAULT 'open',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SCORING RULES TABLE (Versioned score ranges for automatic calculation)
CREATE TABLE IF NOT EXISTS public.scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    rule_version INT NOT NULL DEFAULT 1,
    minimum_score INT NOT NULL,
    maximum_score INT NOT NULL,
    points_awarded INT NOT NULL CHECK (points_awarded BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_range CHECK (minimum_score <= maximum_score)
);

-- 5. SCORE ATTEMPTS TABLE (Supports both manual & automatic scoring methods)
CREATE TABLE IF NOT EXISTS public.score_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT,
    volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    scoring_method TEXT NOT NULL CHECK (scoring_method IN ('manual', 'automatic')),
    raw_score INT CHECK (raw_score >= 0),
    awarded_points INT NOT NULL CHECK (awarded_points BETWEEN 1 AND 100),
    scoring_rule_id UUID REFERENCES public.scoring_rules(id),
    rule_version INT,
    idempotency_key TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('accepted', 'flagged', 'superseded')) DEFAULT 'accepted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT automatic_requires_raw_score CHECK (
        (scoring_method = 'automatic' AND raw_score IS NOT NULL) OR
        (scoring_method = 'manual')
    )
);

-- 6. SCORE CORRECTION REQUESTS TABLE (Prefilled volunteer correction request)
CREATE TABLE IF NOT EXISTS public.score_correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_attempt_id UUID NOT NULL REFERENCES public.score_attempts(id) ON DELETE RESTRICT,
    original_player_id UUID NOT NULL REFERENCES public.players(id),
    original_game_id UUID NOT NULL REFERENCES public.games(id),
    original_raw_score_snapshot INT,
    original_points_snapshot INT NOT NULL,
    original_scoring_method TEXT NOT NULL,
    
    requested_player_id UUID NOT NULL REFERENCES public.players(id),
    requested_game_id UUID NOT NULL REFERENCES public.games(id),
    requested_scoring_method TEXT NOT NULL CHECK (requested_scoring_method IN ('manual', 'automatic')),
    requested_raw_score INT CHECK (requested_raw_score >= 0),
    requested_points INT NOT NULL CHECK (requested_points BETWEEN 1 AND 100),
    
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    decision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SCORE CORRECTION HISTORY TABLE (Immutable audit log of approved corrections)
CREATE TABLE IF NOT EXISTS public.score_correction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.score_correction_requests(id),
    attempt_id UUID NOT NULL REFERENCES public.score_attempts(id),
    
    old_player_id UUID NOT NULL REFERENCES public.players(id),
    new_player_id UUID NOT NULL REFERENCES public.players(id),
    old_game_id UUID NOT NULL REFERENCES public.games(id),
    new_game_id UUID NOT NULL REFERENCES public.games(id),
    
    old_scoring_method TEXT NOT NULL,
    new_scoring_method TEXT NOT NULL,
    previous_raw_score INT,
    new_raw_score INT,
    previous_points INT NOT NULL,
    new_points INT NOT NULL,
    
    approved_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. AUDIT LOGS TABLE (Append-only immutable system trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.profiles(id),
    actor_role_snapshot TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    player_id UUID,
    game_id UUID,
    volunteer_id UUID,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. EVENT SETTINGS TABLE (Event control & PIN hashes)
CREATE TABLE IF NOT EXISTS public.event_settings (
    id INT PRIMARY KEY DEFAULT 1,
    event_name TEXT NOT NULL DEFAULT 'COGAAN Retro Reboot 2.0',
    event_room TEXT NOT NULL DEFAULT 'Manjeera',
    event_date TEXT NOT NULL DEFAULT '12th Oct',
    event_time TEXT NOT NULL DEFAULT '9am-4pm',
    scoring_open BOOLEAN NOT NULL DEFAULT true,
    results_published BOOLEAN NOT NULL DEFAULT true,
    admin_pin_hash TEXT NOT NULL,
    volunteer_pin_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row_config CHECK (id = 1)
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_players_roll_no ON public.players (university_roll_number);
CREATE INDEX IF NOT EXISTS idx_players_active ON public.players (is_active);
CREATE INDEX IF NOT EXISTS idx_games_active_status ON public.games (is_active, scoring_status);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_lookup ON public.scoring_rules (game_id, is_active, minimum_score, maximum_score);
CREATE INDEX IF NOT EXISTS idx_score_attempts_composite ON public.score_attempts (player_id, game_id, status);
CREATE INDEX IF NOT EXISTS idx_score_attempts_volunteer ON public.score_attempts (volunteer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON public.score_correction_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correction_requests_volunteer ON public.score_correction_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action_type, created_at DESC);

-- ==============================================================================
-- VIEWS: BEST SCORE PER PLAYER PER GAME & OVERALL LEADERBOARD
-- Priority: 1) highest awarded_points, 2) highest raw_score (or 0 if null), 3) earliest accepted attempt
-- ==============================================================================
CREATE OR REPLACE VIEW public.player_game_best_scores AS
WITH ranked_attempts AS (
    SELECT
        sa.id AS attempt_id,
        sa.player_id,
        sa.game_id,
        sa.scoring_method,
        sa.raw_score,
        sa.awarded_points,
        sa.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY sa.player_id, sa.game_id
            ORDER BY
                sa.awarded_points DESC,
                COALESCE(sa.raw_score, -1) DESC,
                sa.created_at ASC
        ) AS rank_in_game
    FROM public.score_attempts sa
    JOIN public.players p ON sa.player_id = p.id
    JOIN public.games g ON sa.game_id = g.id
    WHERE sa.status = 'accepted'
      AND p.is_active = true
      AND g.is_active = true
)
SELECT
    ra.attempt_id,
    ra.player_id,
    ra.game_id,
    ra.scoring_method,
    ra.raw_score,
    ra.awarded_points,
    ra.created_at
FROM ranked_attempts ra
WHERE ra.rank_in_game = 1;

CREATE OR REPLACE VIEW public.overall_leaderboard AS
WITH player_totals AS (
    SELECT
        p.id AS player_id,
        p.full_name,
        p.university_roll_number,
        COALESCE(SUM(best.awarded_points), 0) AS total_points,
        COUNT(best.game_id) AS games_played,
        MIN(best.created_at) AS earliest_entry_at
    FROM public.players p
    LEFT JOIN public.player_game_best_scores best ON p.id = best.player_id
    WHERE p.is_active = true
    GROUP BY p.id, p.full_name, p.university_roll_number
)
SELECT
    pt.player_id,
    pt.full_name,
    pt.university_roll_number,
    pt.total_points,
    pt.games_played,
    DENSE_RANK() OVER (
        ORDER BY pt.total_points DESC, pt.earliest_entry_at ASC NULLS LAST
    ) AS rank
FROM player_totals pt;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_correction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check volunteer role
CREATE OR REPLACE FUNCTION public.is_volunteer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'volunteer' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can read their own profile; admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- Games: Publicly readable for active games; Admins can manage
CREATE POLICY "Public can view active games" ON public.games
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage games" ON public.games
    FOR ALL TO authenticated USING (public.is_admin());

-- Scoring Rules: Public can view active rules; Admins can manage
CREATE POLICY "Public can view active scoring rules" ON public.scoring_rules
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage scoring rules" ON public.scoring_rules
    FOR ALL TO authenticated USING (public.is_admin());

-- Players: Public can view active players (sanitized view via API/columns); Admins can manage
CREATE POLICY "Public/Volunteers can view active players" ON public.players
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage players" ON public.players
    FOR ALL TO authenticated USING (public.is_admin());

-- Score Attempts:
-- Volunteers can insert attempts with their own volunteer_id and view their own attempts
CREATE POLICY "Volunteers can insert score attempts" ON public.score_attempts
    FOR INSERT TO authenticated
    WITH CHECK ((volunteer_id = auth.uid() AND public.is_volunteer()) OR public.is_admin());

CREATE POLICY "Volunteers can view their own score attempts" ON public.score_attempts
    FOR SELECT TO authenticated
    USING (volunteer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage all score attempts" ON public.score_attempts
    FOR ALL TO authenticated USING (public.is_admin());

-- Score Correction Requests:
-- Volunteers can insert requests and view their own; Admins can review all
CREATE POLICY "Volunteers can submit correction requests" ON public.score_correction_requests
    FOR INSERT TO authenticated
    WITH CHECK ((requested_by = auth.uid() AND public.is_volunteer()) OR public.is_admin());

CREATE POLICY "Volunteers can view own correction requests" ON public.score_correction_requests
    FOR SELECT TO authenticated
    USING (requested_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage correction requests" ON public.score_correction_requests
    FOR ALL TO authenticated USING (public.is_admin());

-- Score Correction History: Read-only for admins and the requesting volunteer
CREATE POLICY "Admins can view correction history" ON public.score_correction_history
    FOR SELECT TO authenticated USING (public.is_admin());

-- Audit Logs: Admin read-only, append-only
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.is_admin());

-- Event Settings: Public read for general event display; Admins can update
CREATE POLICY "Public can view event settings" ON public.event_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update event settings" ON public.event_settings
    FOR ALL TO authenticated USING (public.is_admin());
