-- Seed v3: Detailed April 7th and 8th Fixtures with Official Logos
DELETE FROM public.matches; -- Clear previous demo matches

INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  -- APRIL 7TH
  (
    'Sporting CP', 
    'Arsenal', 
    'https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_CP.svg', 
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 
    '2026-04-07T21:00:00Z', 
    'UPCOMING'
  ),
  (
    'Real Madrid', 
    'Bayern München', 
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 
    'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 
    '2026-04-07T21:00:00Z', 
    'UPCOMING'
  ),
  -- APRIL 8TH
  (
    'FC Barcelona', 
    'Atlético de Madrid', 
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
    'https://upload.wikimedia.org/wikipedia/en/c/c1/Atletico_Madrid_logo.svg', 
    '2026-04-08T21:00:00Z', 
    'UPCOMING'
  ),
  (
    'Paris Saint-Germain', 
    'Liverpool FC', 
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC_logo.svg', 
    '2026-04-08T21:00:00Z', 
    'UPCOMING'
  );
