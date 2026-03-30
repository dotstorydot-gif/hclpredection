-- Allow deletion for the reset functionality
CREATE POLICY "Allow deletion" ON public.registrations FOR DELETE USING (true);
CREATE POLICY "Allow deletion" ON public.predictions FOR DELETE USING (true);
CREATE POLICY "Allow deletion" ON public.buzzer_hits FOR DELETE USING (true);

-- Immediate clear (run this in Supabase SQL Editor)
DELETE FROM public.registrations;
