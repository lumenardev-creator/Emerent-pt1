-- Manually insert profiles for demo users
INSERT INTO public.profiles (user_id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name
FROM auth.users u
WHERE u.email IN ('admin@akta.com', 'kiosk001@akta.com', 'kiosk002@akta.com', 'kiosk003@akta.com')
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Link kiosk users to their kiosks
UPDATE public.profiles p
SET kiosk_id = k.id
FROM public.kiosks k
WHERE p.email = 'kiosk001@akta.com' 
  AND k.name LIKE '%Downtown%';

UPDATE public.profiles p
SET kiosk_id = k.id
FROM public.kiosks k
WHERE p.email = 'kiosk002@akta.com' 
  AND k.name LIKE '%Mall%';

UPDATE public.profiles p
SET kiosk_id = k.id
FROM public.kiosks k
WHERE p.email = 'kiosk003@akta.com' 
  AND k.name LIKE '%Airport%';