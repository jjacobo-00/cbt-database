-- Add Baptism Info
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS baptism_date TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS baptized_by TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS witness_by TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS place_of_baptism TEXT;
