-- ==============================================================================
-- RETRO REBOOT BY COGAAN - OPTIONAL PLAYER CONTACTS MIGRATION
-- Relaxes NOT NULL constraints on player email and mobile to make them optional alternatives.
-- ==============================================================================

ALTER TABLE public.players ALTER COLUMN university_email DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN mobile_number DROP NOT NULL;
