-- Add buzzer_hits to the realtime publication so Admin/Clients see hits instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.buzzer_hits;
