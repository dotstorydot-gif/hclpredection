-- FIX: Missing goal_number column in buzzer_hits table
-- Run this in the Supabase SQL Editor

-- 1. Add missing goal_number column to buzzer_hits
ALTER TABLE public.buzzer_hits 
ADD COLUMN IF NOT EXISTS goal_number INTEGER DEFAULT 0;

-- 2. Ensure RLS policies are correct for buzzer_hits
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Buzzer hits insertion" ON public.buzzer_hits;
DROP POLICY IF EXISTS "Buzzer hits viewable" ON public.buzzer_hits;
DROP POLICY IF EXISTS "Enable all for buzzer_hits" ON public.buzzer_hits;

-- Create a permissive policy for public buzzer hits (as used in the kiosk/app)
CREATE POLICY "Enable all for buzzer_hits" 
ON public.buzzer_hits FOR ALL 
USING (true) WITH CHECK (true);

-- 3. Ensure registrations has all stamp columns (fallback check)
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_login INTEGER DEFAULT 1;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_prediction INTEGER DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_buzzer INTEGER DEFAULT 0;

-- 4. Ensure matches table has required columns
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS buzzer_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- 5. Re-enable Realtime for buzzer_hits (just in case)
ALTER PUBLICATION supabase_realtime ADD TABLE public.buzzer_hits;
-- Note: If the above fails because it already exists, that's fine.
