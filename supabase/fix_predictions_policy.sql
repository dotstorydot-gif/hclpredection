-- Fix Predictions RLS Policies to allow updates (required for upsert)
DROP POLICY IF EXISTS "Public prediction insertion" ON public.predictions;

CREATE POLICY "Enable all for predictions" 
ON public.predictions 
FOR ALL 
USING (true)
WITH CHECK (true);
