-- Add API synchronization columns to the matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS api_id TEXT UNIQUE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Add index for fast lookups by API ID
CREATE INDEX IF NOT EXISTS idx_matches_api_id ON public.matches(api_id);
