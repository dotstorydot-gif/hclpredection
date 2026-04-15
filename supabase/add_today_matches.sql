-- Clear existing matches to show only today's fixtures
DELETE FROM matches;

-- Insert Bayern vs Real Madrid
INSERT INTO matches (
  id, 
  home_team, 
  away_team, 
  home_logo, 
  away_logo, 
  kickoff_time, 
  status, 
  home_score, 
  away_score, 
  buzzer_active, 
  processed
) VALUES (
  gen_random_uuid(), 
  'Bayern Munich', 
  'Real Madrid', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png', 
  '2026-04-15 19:00:00+00', 
  'UPCOMING', 
  0, 
  0, 
  false, 
  false
);

-- Insert Arsenal vs Sporting
INSERT INTO matches (
  id, 
  home_team, 
  away_team, 
  home_logo, 
  away_logo, 
  kickoff_time, 
  status, 
  home_score, 
  away_score, 
  buzzer_active, 
  processed
) VALUES (
  gen_random_uuid(), 
  'Arsenal', 
  'Sporting CP', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png', 
  '2026-04-15 19:00:00+00', 
  'UPCOMING', 
  0, 
  0, 
  false, 
  false
);
