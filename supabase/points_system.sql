-- Points System Setup
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Index for leaderboard performance
CREATE INDEX IF NOT EXISTS idx_registrations_points ON public.registrations(points DESC);

-- Function to increment points safely
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE registrations
  SET points = COALESCE(points, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
