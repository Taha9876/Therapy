-- ============================================
-- FIX: Create views for joined data
-- PostgREST can't auto-join profiles through auth.users FK
-- Run in Supabase SQL Editor
-- ============================================

-- Auto-approve doctors
UPDATE public.doctors SET status = 'Active' WHERE status = 'Pending';
ALTER TABLE public.doctors ALTER COLUMN status SET DEFAULT 'Active';

-- Create view for doctors with profile names
CREATE OR REPLACE VIEW public.doctors_with_profiles AS
SELECT 
  d.*,
  p.full_name
FROM public.doctors d
LEFT JOIN public.profiles p ON p.user_id = d.user_id;

-- Create view for patients with profile names  
CREATE OR REPLACE VIEW public.patients_with_profiles AS
SELECT 
  pt.*,
  p.full_name,
  d_profiles.full_name AS doctor_name
FROM public.patients pt
LEFT JOIN public.profiles p ON p.user_id = pt.user_id
LEFT JOIN public.doctors doc ON doc.id = pt.assigned_doctor_id
LEFT JOIN public.profiles d_profiles ON d_profiles.user_id = doc.user_id;

-- Create view for appointments with names
CREATE OR REPLACE VIEW public.appointments_with_names AS
SELECT
  a.*,
  pp.full_name AS patient_name,
  dp.full_name AS doctor_name
FROM public.appointments a
LEFT JOIN public.patients pt ON pt.id = a.patient_id
LEFT JOIN public.profiles pp ON pp.user_id = pt.user_id
LEFT JOIN public.doctors doc ON doc.id = a.doctor_id
LEFT JOIN public.profiles dp ON dp.user_id = doc.user_id;

-- Grant access
GRANT SELECT ON public.doctors_with_profiles TO anon, authenticated;
GRANT SELECT ON public.patients_with_profiles TO anon, authenticated;
GRANT SELECT ON public.appointments_with_names TO anon, authenticated;

-- Reload schema
NOTIFY pgrst, 'reload schema';

-- Test
SELECT * FROM public.doctors_with_profiles;
SELECT * FROM public.patients_with_profiles;
