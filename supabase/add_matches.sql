-- Clear existing data to avoid duplicates and FK errors
DELETE FROM public.buzzer_hits;
DELETE FROM public.predictions;
DELETE FROM public.matches;

-- Insert new requested matches
INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  (
    'Atlético Madrid', 
    'Barcelona', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50124.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50080.png', 
    '2026-04-14T19:00:00Z', 
    'UPCOMING'
  ),
  (
    'Liverpool', 
    'PSG', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52747.png',  
    '2026-04-14T19:00:00Z', 
    'UPCOMING'
  );
