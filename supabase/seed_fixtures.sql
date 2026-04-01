-- Final Fixtures Reset: Quarter Final Legs + Test Match (UEFA HD Logos)
DELETE FROM public.buzzer_hits;
DELETE FROM public.predictions;
DELETE FROM public.registrations;
DELETE FROM public.matches;

INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  -- TUESDAY APR 7
  (
    'Real Madrid', 'Bayern München', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50037.png', 
    '2026-04-07T19:00:00Z', 'UPCOMING'
  ),
  (
    'Sporting CP', 'Arsenal', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50030.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52280.png', 
    '2026-04-07T19:00:00Z', 'UPCOMING'
  ),
  -- WEDNESDAY APR 8
  (
    'Barcelona', 'Atlético Madrid', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50080.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50124.png', 
    '2026-04-08T19:00:00Z', 'UPCOMING'
  ),
  (
    'PSG', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52747.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-04-08T19:00:00Z', 'UPCOMING'
  ),
  -- TUESDAY APR 14
  (
    'Atlético Madrid', 'Barcelona', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50124.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50080.png', 
    '2026-04-14T19:00:00Z', 'UPCOMING'
  ),
  (
    'Liverpool', 'PSG', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52747.png', 
    '2026-04-14T19:00:00Z', 'UPCOMING'
  ),
  -- DUMMY TEST MATCH (MANUAL INITIATED / LIVE)
  (
    'Real Madrid', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-04-01T21:00:00Z', 'LIVE'
  );
