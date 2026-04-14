-- PERMISSION FIX: Run this in Supabase SQL Editor
-- This allows the Admin Dashboard to update match scores and statuses

-- 1. Matches Table: Allow Public UPDATES (needed for manual admin control)
CREATE POLICY "Enable updates for all matches" ON public.matches FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 2. Registrations Table: Allow Public UPDATES (needed for awarding stamps)
CREATE POLICY "Enable updates for all registrations" ON public.registrations FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 3. Predictions Table: Ensure updates are allowed
CREATE POLICY "Enable updates for all predictions" ON public.predictions FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Buzzer Hits Table: Allow manual insertion from admin
CREATE POLICY "Enable insertion for all buzzer hits" ON public.buzzer_hits FOR INSERT
WITH CHECK (true);
