-- UCL Quarter-Final Leg 2 — April 14, 2026 @ 9:00 PM CEST (19:00 UTC)
-- Run this in Supabase SQL Editor to add tonight's matches

INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status, home_score, away_score, buzzer_active, processed)
VALUES
  (
    'Atlético Madrid',
    'Barcelona',
    'https://media.api-sports.io/football/teams/530.png',
    'https://media.api-sports.io/football/teams/529.png',
    '2026-04-14T19:00:00Z',
    'UPCOMING',
    0, 0, false, false
  ),
  (
    'Liverpool',
    'PSG',
    'https://media.api-sports.io/football/teams/40.png',
    'https://media.api-sports.io/football/teams/85.png',
    '2026-04-14T19:00:00Z',
    'UPCOMING',
    0, 0, false, false
  )
ON CONFLICT DO NOTHING;
