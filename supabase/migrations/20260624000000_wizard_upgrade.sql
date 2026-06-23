-- Add Student Info
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS student_school TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS student_year_level TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS student_course TEXT;

-- Add Family Info
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS siblings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS father_contact_number TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS mother_contact_number TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS parents_civil_status TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT;

-- Add Education Info
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS highest_educational_attainment TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS education_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS awards_honors TEXT;

-- Create Indexes for faster fetching
CREATE INDEX IF NOT EXISTS idx_members_last_name ON public.members(last_name);
CREATE INDEX IF NOT EXISTS idx_members_first_name ON public.members(first_name);
CREATE INDEX IF NOT EXISTS idx_members_city ON public.members(city);
CREATE INDEX IF NOT EXISTS idx_members_occupation ON public.members(occupation);
CREATE INDEX IF NOT EXISTS idx_members_highest_educational_attainment ON public.members(highest_educational_attainment);
