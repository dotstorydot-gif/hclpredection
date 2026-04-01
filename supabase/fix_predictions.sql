-- Fixes the "Prediction Failed" error by ensuring RLS and Constraints are correctly set
-- 1. Create the unique constraint so "Upsert" works correctly
ALTER TABLE public.predictions 
DROP CONSTRAINT IF EXISTS predictions_registration_id_match_id_key;

ALTER TABLE public.predictions 
ADD CONSTRAINT predictions_registration_id_match_id_key UNIQUE (registration_id, match_id);

-- 2. Enable RLS and create public policies for players
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a prediction (Simplest for this event)
DROP POLICY IF EXISTS "Public can insert predictions" ON public.predictions;
CREATE POLICY "Public can insert predictions" ON public.predictions 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update their existing prediction
DROP POLICY IF EXISTS "Public can update predictions" ON public.predictions;
CREATE POLICY "Public can update predictions" ON public.predictions 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anyone to view predictions (for the leadboard/sync)
DROP POLICY IF EXISTS "Public can view predictions" ON public.predictions;
CREATE POLICY "Public can view predictions" ON public.predictions 
FOR SELECT USING (true);
