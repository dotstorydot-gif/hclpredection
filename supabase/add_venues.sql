-- Clean up and set ONLY the requested venue
-- NOTE: If you have existing registrations, you may need to wipe them first 
-- or update their venue_id to the new one.

DELETE FROM public.venues WHERE name != 'The Villa Hub';

INSERT INTO public.venues (name) VALUES 
  ('The Villa Hub')
ON CONFLICT (name) DO NOTHING;
