-- Clear existing matches to avoid duplicates
DELETE FROM public.matches;

-- Insert new requested matches
INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  (
    'Atlético Madrid', 
    'Barcelona', 
    'https://upload.wikimedia.org/wikipedia/en/c/c1/Atletico_Madrid_logo.svg', 
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
    '2026-04-14T19:00:00Z', 
    'UPCOMING'
  ),
  (
    'Liverpool', 
    'PSG', 
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC_logo.svg', 
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 
    '2026-04-14T19:00:00Z', 
    'UPCOMING'
  );
