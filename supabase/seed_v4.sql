-- Seed v4: Full Quarter-Final Bracket (1st & 2nd Legs)
DELETE FROM public.matches;

INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  -- TUESDAY 7 APRIL (1ST LEGs)
  (
    'Real Madrid', 'Bayern München', 
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 
    'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 
    '2026-04-07T21:00:00Z', 'UPCOMING'
  ),
  (
    'Sporting CP', 'Arsenal', 
    'https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_CP.svg', 
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 
    '2026-04-07T21:00:00Z', 'UPCOMING'
  ),
  -- WEDNESDAY 8 APRIL (1ST LEGs)
  (
    'Paris', 'Liverpool', 
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC_logo.svg', 
    '2026-04-08T21:00:00Z', 'UPCOMING'
  ),
  (
    'Barcelona', 'Atleti', 
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
    'https://upload.wikimedia.org/wikipedia/en/c/c1/Atletico_Madrid_logo.svg', 
    '2026-04-08T21:00:00Z', 'UPCOMING'
  ),
  -- TUESDAY 14 APRIL (2ND LEGS)
  (
    'Atleti', 'Barcelona', 
    'https://upload.wikimedia.org/wikipedia/en/c/c1/Atletico_Madrid_logo.svg', 
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
    '2026-04-14T21:00:00Z', 'UPCOMING'
  ),
  (
    'Liverpool', 'Paris', 
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC_logo.svg', 
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 
    '2026-04-14T21:00:00Z', 'UPCOMING'
  ),
  -- WEDNESDAY 15 APRIL (2ND LEGS)
  (
    'Arsenal', 'Sporting CP', 
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 
    'https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_CP.svg', 
    '2026-04-15T21:00:00Z', 'UPCOMING'
  ),
  (
    'Bayern München', 'Real Madrid', 
    'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 
    '2026-04-15T21:00:00Z', 'UPCOMING'
  );
