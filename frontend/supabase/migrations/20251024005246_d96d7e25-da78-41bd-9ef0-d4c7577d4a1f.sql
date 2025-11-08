-- Delete the manually created auth users that are causing issues
DELETE FROM auth.users 
WHERE email IN ('admin@akta.com', 'kiosk001@akta.com', 'kiosk002@akta.com', 'kiosk003@akta.com');