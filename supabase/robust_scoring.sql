-- Super Scorer Reliability Engine V2: 300+ users, venue-specific bonuses
-- 1. Ensure columns exist
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;
ALTER TABLE public.buzzer_hits ADD COLUMN IF NOT EXISTS goal_number INTEGER DEFAULT 0;

-- 2. Index for high-speed "First at Venue" lookups
CREATE INDEX IF NOT EXISTS idx_buzzer_hits_venue_goal ON public.buzzer_hits(match_id, venue_id, goal_number, hit_time ASC);

-- 3. Automatic "Instant Scorer" Function: Awards 5 points to the first hitter per goal/venue
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
    -- This user is the Venue Champion! Award 5 points instantly.
    UPDATE public.registrations
    SET points = COALESCE(points, 0) + 5
    WHERE id = NEW.registration_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up the Trigger for Instant Rewards
DROP TRIGGER IF EXISTS trg_instant_buzzer_points ON public.buzzer_hits;
CREATE TRIGGER trg_instant_buzzer_points
BEFORE INSERT ON public.buzzer_hits
FOR EACH ROW EXECUTE FUNCTION award_instant_buzzer_points();

-- 5. Prediction Scorer RPC: Processes correct predictors at the end of the match
CREATE OR REPLACE FUNCTION award_points_for_match(m_id UUID, win_choice TEXT)
RETURNS VOID AS $$
BEGIN
  -- 1. Award 10 points to correct predictors
  UPDATE public.registrations
  SET points = COALESCE(points, 0) + 10
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
  UPDATE public.registrations SET points = 0;
  UPDATE public.matches SET processed = false;
  DELETE FROM public.buzzer_hits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
