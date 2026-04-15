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
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_München_logo_%282017%29.svg/1200px-FC_Bayern_München_logo_%282017%29.svg.png', 
  'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png', 
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
  'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png', 
  'https://upload.wikimedia.org/wikipedia/pt/thumb/3/3e/Sporting_Clube_de_Portugal.svg/1200px-Sporting_Clube_de_Portugal.svg.png', 
  '2026-04-15 19:00:00+00', 
  'UPCOMING', 
  0, 
  0, 
  false, 
  false
);
