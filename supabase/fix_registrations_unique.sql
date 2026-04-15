-- 1. Identify and delete duplicate registrations, keeping only the one with the most stamps
DELETE FROM public.registrations
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY phone 
                   ORDER BY (stamps_login + stamps_prediction + stamps_buzzer) DESC, created_at DESC
               ) as rank
        FROM public.registrations
    ) sub
    WHERE rank = 1
);

-- 2. Now that duplicates are gone, add the unique constraint safely
ALTER TABLE public.registrations ADD CONSTRAINT registrations_phone_unique UNIQUE (phone);
