-- fix_all_permissions.sql
-- Run this in the Supabase SQL Editor to ensure the app has full access

-- 1. Predictions: Allow all operations (Insert, Update, Select)
DROP POLICY IF EXISTS "Enable all for predictions" ON public.predictions;
DROP POLICY IF EXISTS "Public prediction insertion" ON public.predictions;
DROP POLICY IF EXISTS "Predictions viewable" ON public.predictions;

CREATE POLICY "Enable all for predictions" 
ON public.predictions FOR ALL 
USING (true) WITH CHECK (true);

-- 2. Registrations: Allow all operations
DROP POLICY IF EXISTS "Public registration insertion" ON public.registrations;
DROP POLICY IF EXISTS "User view own registration" ON public.registrations;
DROP POLICY IF EXISTS "Allow deletion" ON public.registrations;

CREATE POLICY "Enable all for registrations" 
ON public.registrations FOR ALL 
USING (true) WITH CHECK (true);

-- 3. Buzzer Hits: Allow all operations
DROP POLICY IF EXISTS "Buzzer hits insertion" ON public.buzzer_hits;
DROP POLICY IF EXISTS "Buzzer hits viewable" ON public.buzzer_hits;
DROP POLICY IF EXISTS "Allow deletion" ON public.buzzer_hits;

CREATE POLICY "Enable all for buzzer_hits" 
ON public.buzzer_hits FOR ALL 
USING (true) WITH CHECK (true);

-- 4. Matches: Ensure viewable
DROP POLICY IF EXISTS "Matches viewable" ON public.matches;
CREATE POLICY "Matches viewable" ON public.matches FOR SELECT USING (true);
