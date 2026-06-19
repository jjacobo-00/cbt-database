-- Seed ministries
INSERT INTO public.ministries (id, name, description) VALUES 
(gen_random_uuid(), 'Evangelism Ministry', 'Outreach and sharing the gospel'),
(gen_random_uuid(), 'Sunday School Ministry', 'Teaching foundational biblical truths'),
(gen_random_uuid(), 'Youth Christian Ministry', 'Engaging and discipling the youth'),
(gen_random_uuid(), 'Music Ministry', 'Leading the congregation in worship'),
(gen_random_uuid(), 'Men Of Faith Ministry', 'Fellowship and growth for men'),
(gen_random_uuid(), 'Ladies For Christ Ministry', 'Fellowship and growth for women'),
(gen_random_uuid(), 'Prayer Ministry', 'Dedicated intercessory prayer group')
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Members
INSERT INTO public.members (
    first_name, last_name, sex, city, contact_number, occupation, years_in_church
) VALUES 
('John', 'Doe', 'Male', 'Quezon City', '09171234567', 'Engineer', 5),
('Jane', 'Smith', 'Female', 'Manila', '09181234567', 'Teacher', 3),
('Michael', 'Johnson', 'Male', 'Makati', '09191234567', 'Accountant', 10),
('Sarah', 'Williams', 'Female', 'Pasig', '09201234567', 'Nurse', 2),
('David', 'Brown', 'Male', 'Taguig', '09211234567', 'Developer', 1)
;
