-- seed_test_match.sql
-- Reset all match and prediction data for a clean test
DELETE FROM public.buzzer_hits;
DELETE FROM public.predictions;
DELETE FROM public.matches;

-- Insert fresh test match (Liverpool vs Real Madrid)
-- Kickoff set to tonight (9PM UTC / 11PM Local) to ensure it is UNLOCKED
INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES (
  'Liverpool', 
  'Real Madrid', 
  'https://img.uefa.com/imgml/TP/teams/logos/70x70/7889.png', 
  'https://img.uefa.com/imgml/TP/teams/logos/70x70/50051.png', 
  '2026-04-06T21:00:00Z', 
  'UPCOMING'
);
