-- PERMISSION FIX: Run this in Supabase SQL Editor
-- This allows the Admin Dashboard to update match scores and statuses

-- 1. Matches Table: Clear old policy and allow updates
DROP POLICY IF EXISTS "Enable updates for all matches" ON public.matches;
CREATE POLICY "Enable updates for all matches" ON public.matches FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 2. Registrations Table: Clear old policy and allow updates
DROP POLICY IF EXISTS "Enable updates for all registrations" ON public.registrations;
CREATE POLICY "Enable updates for all registrations" ON public.registrations FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 3. Predictions Table: Clear old policy and allow updates
DROP POLICY IF EXISTS "Enable updates for all predictions" ON public.predictions;
CREATE POLICY "Enable updates for all predictions" ON public.predictions FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Buzzer Hits Table: Clear old policy and allow manual triggers
DROP POLICY IF EXISTS "Enable insertion for all buzzer hits" ON public.buzzer_hits;
CREATE POLICY "Enable insertion for all buzzer hits" ON public.buzzer_hits FOR INSERT
WITH CHECK (true);
