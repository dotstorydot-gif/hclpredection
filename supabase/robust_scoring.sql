-- Robust Scoring System: Handles 300+ users in a single transaction
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Super Scorer RPC: Processes all winners for a match in one go
CREATE OR REPLACE FUNCTION award_points_for_match(m_id UUID, win_choice TEXT)
RETURNS VOID AS $$
BEGIN
  -- 1. Identify and Award points to all correct predictors at once
  UPDATE public.registrations
  SET points = COALESCE(points, 0) + 10
  WHERE id IN (
    SELECT registration_id 
    FROM public.predictions 
    WHERE match_id = m_id AND winner_choice = win_choice
  );
  
  -- 2. Mark match as processed and finished
  UPDATE public.matches 
  SET processed = true, status = 'FINISHED', buzzer_active = false
  WHERE id = m_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple helper to reset points if needed during testing
CREATE OR REPLACE FUNCTION reset_all_player_points()
RETURNS VOID AS $$
BEGIN
  UPDATE public.registrations SET points = 0;
  UPDATE public.matches SET processed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
