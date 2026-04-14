-- FIX SCRIPT: Run this in Supabase SQL Editor to fix Registration Failure
-- This adds the missing columns that the app expects

-- 1. Add missing columns to registrations
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_login INTEGER DEFAULT 1;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_prediction INTEGER DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stamps_buzzer INTEGER DEFAULT 0;

-- 2. Add missing columns to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- 3. Ensure the index for ranking exists
CREATE INDEX IF NOT EXISTS idx_registrations_stamps_total ON public.registrations((stamps_login + stamps_prediction + stamps_buzzer) DESC);

-- 4. Cleanup any existing duplicate venues just in case
INSERT INTO public.venues (name) VALUES 
  ('The Villa Hub')
ON CONFLICT (name) DO NOTHING;
