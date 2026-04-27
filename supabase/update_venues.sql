-- Add the new venues to the system
INSERT INTO public.venues (name) VALUES 
  ('Villa'),
  ('Buffalo Wings & Rings'),
  ('Le Meridian Airport'),
  ('JW Mariott Mirage - Plato'),
  ('Westin Dunes')
ON CONFLICT (name) DO NOTHING;

-- List current venues to verify
SELECT name FROM public.venues;
