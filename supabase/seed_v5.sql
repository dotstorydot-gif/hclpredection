-- Seed v5: High-Resolution UEFI CDN Logos for all Quarter-Finalists
DELETE FROM public.matches;

INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  -- TUESDAY 7 APRIL (1ST LEGS)
  (
    'Real Madrid', 'Bayern München', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50037.png', 
    '2026-04-07T21:00:00Z', 'UPCOMING'
  ),
  (
    'Sporting CP', 'Arsenal', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50149.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52280.png', 
    '2026-04-07T21:00:00Z', 'UPCOMING'
  ),
  -- WEDNESDAY 8 APRIL (1ST LEGS)
  (
    'Paris', 'Liverpool', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52747.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    '2026-04-08T21:00:00Z', 'UPCOMING'
  ),
  (
    'Barcelona', 'Atleti', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50080.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50124.png', 
    '2026-04-08T21:00:00Z', 'UPCOMING'
  ),
  -- TUESDAY 14 APRIL (2ND LEGS)
  (
    'Atleti', 'Barcelona', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50124.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50080.png', 
    '2026-04-14T21:00:00Z', 'UPCOMING'
  ),
  (
    'Liverpool', 'Paris', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52747.png', 
    '2026-04-14T21:00:00Z', 'UPCOMING'
  ),
  -- WEDNESDAY 15 APRIL (2ND LEGS)
  (
    'Arsenal', 'Sporting CP', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/52280.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50149.png', 
    '2026-04-15T21:00:00Z', 'UPCOMING'
  ),
  (
    'Bayern München', 'Real Madrid', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50037.png', 
    'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
    '2026-04-15T21:00:00Z', 'UPCOMING'
  );
