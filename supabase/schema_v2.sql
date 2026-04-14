-- Reset schema for v2
DROP TABLE IF EXISTS public.buzzer_hits;
DROP TABLE IF EXISTS public.predictions;
DROP TABLE IF EXISTS public.matches;
DROP TABLE IF EXISTS public.registrations;
DROP TABLE IF EXISTS public.venues;

-- Create venues table
CREATE TABLE public.venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create registrations table (Name, Phone, Venue)
CREATE TABLE public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  venue_id UUID REFERENCES public.venues(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table with buzzer support
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo TEXT, -- URL to logo
  away_logo TEXT, -- URL to logo
  kickoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'FINISHED')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  buzzer_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions (Who will win)
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  winner_choice TEXT CHECK (winner_choice IN ('HOME', 'AWAY', 'DRAW')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(registration_id, match_id)
);

-- Create buzzer hits with millisecond precision
CREATE TABLE public.buzzer_hits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  hit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for matches table (Crucial for the Buzzer)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzzer_hits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public venues viewable" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public registration insertion" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "User view own registration" ON public.registrations FOR SELECT USING (true); -- Simplified for public kiosks/phones

CREATE POLICY "Matches viewable" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Predictions viewable" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Public prediction insertion" ON public.predictions FOR INSERT WITH CHECK (true);

CREATE POLICY "Buzzer hits insertion" ON public.buzzer_hits FOR INSERT WITH CHECK (true);
CREATE POLICY "Buzzer hits viewable" ON public.buzzer_hits FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON public.predictions
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Seed initial venues
INSERT INTO public.venues (name) VALUES 
  ('The Villa Hub')
ON CONFLICT (name) DO NOTHING;
