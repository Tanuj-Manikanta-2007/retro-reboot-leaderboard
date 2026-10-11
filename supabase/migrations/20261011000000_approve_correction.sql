-- ==============================================================================
-- RETRO REBOOT BY COGAAN - ATOMIC CORRECTION APPROVAL PROCEDURE
-- Ensures approved corrections replace prior active scores atomically.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.approve_score_correction(
    p_request_id UUID,
    p_admin_id UUID,
    p_decision_reason TEXT DEFAULT 'Approved by administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
    v_player_active BOOLEAN;
    v_game_active BOOLEAN;
    v_history_id UUID;
BEGIN
    -- 1. Fetch pending request with row-level lock to prevent concurrent modifications
    SELECT * INTO v_req
    FROM public.score_correction_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Score correction request % not found', p_request_id;
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Score correction request % has already been resolved (current status: %)', p_request_id, v_req.status;
    END IF;

    -- 2. Validate target player
    SELECT is_active INTO v_player_active
    FROM public.players
    WHERE id = v_req.requested_player_id;

    IF v_player_active IS NULL OR v_player_active = false THEN
        RAISE EXCEPTION 'Target player % is not active or registered', v_req.requested_player_id;
    END IF;

    -- 3. Validate target game
    SELECT is_active INTO v_game_active
    FROM public.games
    WHERE id = v_req.requested_game_id;

    IF v_game_active IS NULL OR v_game_active = false THEN
        RAISE EXCEPTION 'Target game % is not active', v_req.requested_game_id;
    END IF;

    -- 4. Validate points & score
    IF v_req.requested_points < 1 OR v_req.requested_points > 100 THEN
        RAISE EXCEPTION 'Awarded points must be between 1 and 100 (got %)', v_req.requested_points;
    END IF;

    -- 5. Supersede any other active (accepted) attempts for the target player and game
    UPDATE public.score_attempts
    SET status = 'superseded',
        updated_at = timezone('utc'::text, now())
    WHERE player_id = v_req.requested_player_id
      AND game_id = v_req.requested_game_id
      AND id != v_req.original_attempt_id
      AND status = 'accepted';

    -- 6. Apply correction to the official result for that player and game
    UPDATE public.score_attempts
    SET player_id = v_req.requested_player_id,
        game_id = v_req.requested_game_id,
        scoring_method = v_req.requested_scoring_method,
        raw_score = v_req.requested_raw_score,
        awarded_points = v_req.requested_points,
        status = 'accepted',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_req.original_attempt_id;

    -- 7. Write to immutable score correction history
    v_history_id := uuid_generate_v4();
    INSERT INTO public.score_correction_history (
        id,
        request_id,
        attempt_id,
        old_player_id,
        new_player_id,
        old_game_id,
        new_game_id,
        old_scoring_method,
        new_scoring_method,
        previous_raw_score,
        new_raw_score,
        previous_points,
        new_points,
        approved_by,
        approved_at
    ) VALUES (
        v_history_id,
        v_req.id,
        v_req.original_attempt_id,
        v_req.original_player_id,
        v_req.requested_player_id,
        v_req.original_game_id,
        v_req.requested_game_id,
        v_req.original_scoring_method,
        v_req.requested_scoring_method,
        v_req.original_raw_score_snapshot,
        v_req.requested_raw_score,
        v_req.original_points_snapshot,
        v_req.requested_points,
        p_admin_id,
        timezone('utc'::text, now())
    );

    -- 8. Mark request approved
    UPDATE public.score_correction_requests
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = timezone('utc'::text, now()),
        decision_reason = p_decision_reason,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_req.id;

    -- 9. Record system audit log
    INSERT INTO public.audit_logs (
        id,
        actor_user_id,
        actor_role_snapshot,
        action_type,
        entity_type,
        entity_id,
        player_id,
        game_id,
        volunteer_id,
        old_values,
        new_values,
        reason,
        request_id,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        p_admin_id,
        'admin',
        'correction_approved',
        'score_attempts',
        v_req.original_attempt_id,
        v_req.requested_player_id,
        v_req.requested_game_id,
        v_req.requested_by,
        jsonb_build_object(
            'player_id', v_req.original_player_id,
            'game_id', v_req.original_game_id,
            'scoring_method', v_req.original_scoring_method,
            'raw_score', v_req.original_raw_score_snapshot,
            'awarded_points', v_req.original_points_snapshot
        ),
        jsonb_build_object(
            'player_id', v_req.requested_player_id,
            'game_id', v_req.requested_game_id,
            'scoring_method', v_req.requested_scoring_method,
            'raw_score', v_req.requested_raw_score,
            'awarded_points', v_req.requested_points
        ),
        v_req.reason,
        v_req.id,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_req.id,
        'attempt_id', v_req.original_attempt_id,
        'history_id', v_history_id,
        'requested_player_id', v_req.requested_player_id,
        'requested_game_id', v_req.requested_game_id,
        'points', v_req.requested_points
    );
END;
$$;
