-- ==============================================================================
-- RETRO REBOOT BY COGAAN (RETRO 2.0) - SEED DATA
-- Default event settings, games, scoring rules, and test participants
-- ==============================================================================

-- 1. EVENT SETTINGS (Default Admin PIN: 654321, Volunteer PIN: 1234)
-- SHA-256 of '654321' is '481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5' (illustrative demo hash)
-- SHA-256 of '1234' is '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
INSERT INTO public.event_settings (id, event_name, event_room, event_date, event_time, scoring_open, results_published, admin_pin_hash, volunteer_pin_hash)
VALUES (
    1,
    'COGAAN Retro Reboot 2.0',
    'Manjeera',
    '12th Oct',
    '9am-4pm',
    true,
    true,
    '481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
)
ON CONFLICT (id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    event_room = EXCLUDED.event_room,
    event_date = EXCLUDED.event_date,
    event_time = EXCLUDED.event_time;

-- 2. SAMPLE TOURNAMENT GAMES
INSERT INTO public.games (id, name, description, is_active, scoring_status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Retro Tetris', 'Classic 8-bit NES high-stack clearing challenge.', true, 'open'),
    ('22222222-2222-2222-2222-222222222222', 'Pac-Man Arcade', 'Retro maze dot eating and ghost chasing tournament.', true, 'open'),
    ('33333333-3333-3333-3333-333333333333', 'Tekken Retro Clash', 'Best of 3 1v1 fighting rounds.', true, 'open'),
    ('44444444-4444-4444-4444-444444444444', 'Super Mario Bros Speedrun', 'World 1-1 to 1-4 time trial run.', true, 'open')
ON CONFLICT (name) DO NOTHING;

-- 3. SCORING RULES FOR GAMES (Non-overlapping ranges for Automatic Calculation Mode)
-- For Retro Tetris:
INSERT INTO public.scoring_rules (game_id, rule_version, minimum_score, maximum_score, points_awarded, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 1, 0, 9999, 10, true),
    ('11111111-1111-1111-1111-111111111111', 1, 10000, 24999, 25, true),
    ('11111111-1111-1111-1111-111111111111', 1, 25000, 49999, 50, true),
    ('11111111-1111-1111-1111-111111111111', 1, 50000, 99999, 75, true),
    ('11111111-1111-1111-1111-111111111111', 1, 100000, 9999999, 100, true),

-- For Pac-Man Arcade:
    ('22222222-2222-2222-2222-222222222222', 1, 0, 4990, 15, true),
    ('22222222-2222-2222-2222-222222222222', 1, 5000, 9990, 30, true),
    ('22222222-2222-2222-2222-222222222222', 1, 10000, 19990, 60, true),
    ('22222222-2222-2222-2222-222222222222', 1, 20000, 999999, 90, true)
ON CONFLICT DO NOTHING;

-- 4. SAMPLE REGISTERED PLAYERS
INSERT INTO public.players (id, full_name, university_roll_number, university_email, mobile_number, discovery_source, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rahul Kumar', '2026CSE001', 'rahul.k@univ.edu', '9876543210', 'Posters', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Priya Sharma', '2026CSE002', 'priya.s@univ.edu', '9876543211', 'Instagram', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Arjun Reddy', '2026ECE045', 'arjun.r@univ.edu', '9876543212', 'Friends', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Ananya Iyer', '2026AIML012', 'ananya.i@univ.edu', '9876543213', 'WhatsApp group', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Vikram Seth', '2026IT088', 'vikram.s@univ.edu', '9876543214', 'Manjeera', true)
ON CONFLICT (university_roll_number) DO NOTHING;
