-- Seed v2: Venues and Interactive Matches
INSERT INTO public.venues (name) VALUES 
  ('The Champions Lounge'),
  ('Winners Circle Sports Bar'),
  ('UCL Fan Zone - Venue A'),
  ('Golden Goal Hub');

-- Seed v2: Upcoming and Live Matches with Logos
INSERT INTO public.matches (home_team, away_team, home_logo, away_logo, kickoff_time, status)
VALUES 
  (
    'Real Madrid', 
    'Manchester City', 
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg', 
    NOW() + interval '2 hours', 
    'UPCOMING'
  ),
  (
    'Arsenal', 
    'Bayern Munich', 
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 
    'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 
    NOW() - interval '10 minutes', 
    'LIVE'
  ),
  (
    'PSG', 
    'Barcelona', 
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
    NOW() + interval '1 day', 
    'UPCOMING'
  );

-- Note: Admin can update scores and trigger buzzers via the /#admin view
