-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: public.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'member')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    sex TEXT CHECK (sex IN ('Male', 'Female')),
    age INTEGER,
    birth_date DATE,
    birth_place TEXT,
    contact_number TEXT,
    
    -- Address
    house_number TEXT,
    unit_number TEXT,
    street TEXT,
    barangay TEXT,
    city TEXT,
    province TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Philippines',
    
    -- Work
    occupation TEXT,
    company TEXT,
    position TEXT,
    employment_status TEXT,
    work_address TEXT,
    work_contact_number TEXT,
    
    -- Family
    marital_status TEXT,
    father_name TEXT,
    father_occupation TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    spouse_name TEXT,
    spouse_occupation TEXT,
    anniversary_date DATE,
    
    -- Church Info
    current_church TEXT DEFAULT 'Current Church',
    date_saved DATE,
    witnessed_by TEXT,
    baptized_by TEXT,
    date_baptized DATE,
    place_of_baptism TEXT,
    years_in_church INTEGER,
    prev_church_name TEXT,
    prev_church_years INTEGER,
    
    -- Education
    elem_school TEXT,
    elem_year INTEGER,
    hs_school TEXT,
    hs_year INTEGER,
    voc_course TEXT,
    voc_year INTEGER,
    college_course TEXT,
    college_year INTEGER,
    grad_major TEXT,
    grad_year INTEGER,
    
    -- Talents
    talents TEXT[],
    
    -- Metadata
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.children
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.ministries
CREATE TABLE IF NOT EXISTS public.ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.member_ministries
CREATE TABLE IF NOT EXISTS public.member_ministries (
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    PRIMARY KEY (member_id, ministry_id)
);

-- RLS setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_ministries ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

-- Policies for members, children, member_ministries
CREATE POLICY "Auth users can read members" ON public.members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert members" ON public.members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update members" ON public.members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Auth users can read children" ON public.children FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert children" ON public.children FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update children" ON public.children FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete children" ON public.children FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Auth users can read member_ministries" ON public.member_ministries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert member_ministries" ON public.member_ministries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update member_ministries" ON public.member_ministries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete member_ministries" ON public.member_ministries FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

-- Policies for ministries
CREATE POLICY "Auth users can read ministries" ON public.ministries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert ministries" ON public.ministries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can update ministries" ON public.ministries FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can delete ministries" ON public.ministries FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
