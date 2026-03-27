-- ============================================
-- ASSIGN ADMIN ROLE
-- Run AFTER creating admin123@gmail.com user
-- via Dashboard > Authentication > Users > Add User
-- ============================================

-- The trigger auto-creates patient role. Update it to admin:
UPDATE public.user_roles
SET role = 'admin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin123@gmail.com');

-- Verify
SELECT u.email, ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin123@gmail.com';
