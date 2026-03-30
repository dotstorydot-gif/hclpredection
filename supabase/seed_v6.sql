-- Seed v6: Test matches for Mar 30 - Apr 2 (Real Madrid vs Liverpool)
INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  -- TODAY
  (
    'Real Madrid', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-03-30T21:00:00Z', 'UPCOMING'
  ),
  -- TOMORROW
  (
    'Real Madrid', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-03-31T21:00:00Z', 'UPCOMING'
  ),
  -- APR 1
  (
    'Real Madrid', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-04-01T21:00:00Z', 'UPCOMING'
  ),
  -- APR 2
  (
    'Real Madrid', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-04-02T21:00:00Z', 'UPCOMING'
  );
