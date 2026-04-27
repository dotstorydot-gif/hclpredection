-- Add PSG vs Bayern Munich Semi-final
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
  'PSG', 
  'Bayern Munich', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png', 
  'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 
  '2026-04-28 19:00:00+00', -- 10:00 PM Cairo/Local time
  'UPCOMING', 
  0, 
  0, 
  false, 
  false
);
