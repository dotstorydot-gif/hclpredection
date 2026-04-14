-- Stamp System Refactor: 1 Stamp per Achievement
-- 1. Ensure Stamp columns exist
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_login INTEGER DEFAULT 1;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_prediction INTEGER DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_buzzer INTEGER DEFAULT 0;

-- 2. Index for Leaderboard (Total Stamps Ranking)
CREATE INDEX IF NOT EXISTS idx_registrations_stamps_total ON public.registrations((stamps_login + stamps_prediction + stamps_buzzer) DESC);

-- 3. Automatic "Buzzer Stamp" Scorer: Award 1 Stamp to the first hitter per goal/venue
CREATE OR REPLACE FUNCTION award_instant_buzzer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the FIRST hit for this specific goal at this venue
  IF NOT EXISTS (
    SELECT 1 FROM public.buzzer_hits
    WHERE match_id = NEW.match_id 
      AND venue_id = NEW.venue_id 
      AND goal_number = NEW.goal_number
      AND id <> NEW.id
  ) THEN
    -- Venue Champion! Award 1 Buzzer Stamp.
    UPDATE public.registrations
    SET stamps_buzzer = COALESCE(stamps_buzzer, 0) + 1
    WHERE id = NEW.registration_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up the Trigger
DROP TRIGGER IF EXISTS trg_instant_buzzer_points ON public.buzzer_hits;
CREATE TRIGGER trg_instant_buzzer_points
BEFORE INSERT ON public.buzzer_hits
FOR EACH ROW EXECUTE FUNCTION award_instant_buzzer_points();

-- 5. Prediction Scorer RPC: Awards 1 Stamp for matching winners
CREATE OR REPLACE FUNCTION award_points_for_match(m_id UUID, win_choice TEXT)
RETURNS VOID AS $$
BEGIN
  -- 1. Award 1 Prediction Stamp to correct predictors
  UPDATE public.registrations
  SET stamps_prediction = COALESCE(stamps_prediction, 0) + 1
  WHERE id IN (
    SELECT registration_id 
    FROM public.predictions 
    WHERE match_id = m_id AND winner_choice = win_choice
  );
  
  -- 2. Mark match as processed
  UPDATE public.matches 
  SET processed = true, status = 'FINISHED', buzzer_active = false
  WHERE id = m_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset utility
CREATE OR REPLACE FUNCTION reset_all_player_points()
RETURNS VOID AS $$
BEGIN
  -- 1. Reset all player stamps and points
  UPDATE public.registrations SET stamps_login = 1, stamps_prediction = 0, stamps_buzzer = 0, points = 0;
  
  -- 2. Reset match scores and statuses
  UPDATE public.matches SET processed = false, home_score = 0, away_score = 0, status = 'UPCOMING', buzzer_active = false;
  
  -- 3. Delete all history
  DELETE FROM public.predictions;
  DELETE FROM public.buzzer_hits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
