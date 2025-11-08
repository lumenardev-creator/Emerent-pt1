-- Manually assign roles to existing demo users (bypass RLS with direct inserts)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@akta.com' THEN 'admin'::app_role
    WHEN u.email LIKE 'kiosk%@akta.com' THEN 'kiosk_user'::app_role
  END as role
FROM auth.users u
WHERE u.email IN ('admin@akta.com', 'kiosk001@akta.com', 'kiosk002@akta.com', 'kiosk003@akta.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
  );