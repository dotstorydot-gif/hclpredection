-- Allow public update for matches (to change status/score/buzzer_active)
CREATE POLICY "Matches updateable" ON public.matches FOR UPDATE USING (true);

-- Allow public deletion for buzzer_hits (to clear for new buzzer window)
CREATE POLICY "Buzzer hits deletable" ON public.buzzer_hits FOR DELETE USING (true);
