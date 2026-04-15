-- Add unique constraint to phone number to enable session recovery
ALTER TABLE public.registrations ADD CONSTRAINT registrations_phone_unique UNIQUE (phone);
