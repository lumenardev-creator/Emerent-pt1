-- Create demo users using a function approach
DO $$
DECLARE
  admin_user_id uuid;
  kiosk1_user_id uuid;
  kiosk2_user_id uuid;
  kiosk3_user_id uuid;
BEGIN
  -- Insert admin user if doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@akta.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@akta.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      false,
      'authenticated',
      'authenticated'
    ) RETURNING id INTO admin_user_id;
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::public.app_role);
  END IF;

  -- Insert kiosk user 1
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kiosk001@akta.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'kiosk001@akta.com',
      crypt('kiosk123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Downtown Fresh Market"}',
      false,
      'authenticated',
      'authenticated'
    ) RETURNING id INTO kiosk1_user_id;
    
    -- Assign kiosk role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (kiosk1_user_id, 'kiosk_user'::public.app_role);
  END IF;

  -- Insert kiosk user 2
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kiosk002@akta.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'kiosk002@akta.com',
      crypt('kiosk123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Mall Central Kiosk"}',
      false,
      'authenticated',
      'authenticated'
    ) RETURNING id INTO kiosk2_user_id;
    
    -- Assign kiosk role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (kiosk2_user_id, 'kiosk_user'::public.app_role);
  END IF;

  -- Insert kiosk user 3
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kiosk003@akta.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'kiosk003@akta.com',
      crypt('kiosk123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Airport Terminal Kiosk"}',
      false,
      'authenticated',
      'authenticated'
    ) RETURNING id INTO kiosk3_user_id;
    
    -- Assign kiosk role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (kiosk3_user_id, 'kiosk_user'::public.app_role);
  END IF;
END $$;