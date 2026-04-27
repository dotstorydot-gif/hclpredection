-- 1. Rename 'Villa' to 'Villa Hub' (This becomes our main entry)
UPDATE public.venues SET name = 'Villa Hub' WHERE name = 'Villa';

-- 2. Move all players from 'The Villa Hub' to 'Villa Hub'
UPDATE public.registrations
SET venue_id = (SELECT id FROM public.venues WHERE name = 'Villa Hub')
WHERE venue_id = (SELECT id FROM public.venues WHERE name = 'The Villa Hub');

-- 3. Move any buzzer hits if they exist
UPDATE public.buzzer_hits
SET venue_id = (SELECT id FROM public.venues WHERE name = 'Villa Hub')
WHERE venue_id = (SELECT id FROM public.venues WHERE name = 'The Villa Hub');

-- 4. Delete the old 'The Villa Hub' entry
DELETE FROM public.venues WHERE name = 'The Villa Hub';

-- 5. Verify the final clean list
SELECT name FROM public.venues;
