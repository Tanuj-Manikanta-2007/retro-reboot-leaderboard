-- ==============================================================================
-- RETRO REBOOT 2.0 - FLUSH TOURNAMENT DATA (KEEP TABLE SCHEMAS INTACT)
-- ==============================================================================
-- Run this query in the Supabase Dashboard SQL Editor (https://supabase.com)
-- to wipe dummy/test data and start fresh from scratch.
--
-- All tables, constraints, indexes, RLS policies, and triggers are 100% PRESERVED.
-- ==============================================================================

-- 1. FLUSH TOURNAMENT PARTICIPATION & SCORES
-- (Leaves Games and Scoring Rules intact so you don't need to reconfigure them)
TRUNCATE TABLE 
    public.score_correction_history,
    public.score_correction_requests,
    public.score_attempts,
    public.audit_logs,
    public.players
CASCADE;

-- 2. OPTIONAL: FULL TOURNAMENT RESET (Including Games & Rules)
-- (Uncomment below if you also want to remove all games and rules):
-- TRUNCATE TABLE 
--     public.score_correction_history,
--     public.score_correction_requests,
--     public.score_attempts,
--     public.audit_logs,
--     public.players,
--     public.scoring_rules,
--     public.games
-- CASCADE;
