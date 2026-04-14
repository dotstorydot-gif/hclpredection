-- Seed v2: Venues and Interactive Matches
INSERT INTO public.venues (name) VALUES 
  ('The Villa Hub')
ON CONFLICT (name) DO NOTHING;

-- Seed v2: Upcoming and Live Matches with Logos
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

-- Note: Admin can update scores and trigger buzzers via the /#admin view
