-- =====================================================
-- Create Demo Users for Testing
-- =====================================================
-- NOTE: This script creates users directly in the database
-- In production, use Supabase Auth API or dashboard

-- First, you need to create users via Supabase Dashboard or Auth API
-- Then run this script to assign roles and create profiles

-- For now, this is a template. You need to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" 
-- 3. Create these users (disable email confirmation for testing):

-- ADMIN USER:
-- Email: admin@akta-mmi.com
-- Password: Admin123!
-- Confirm email: YES

-- KIOSK USER 1:
-- Email: kiosk1@akta-mmi.com  
-- Password: Kiosk123!
-- Confirm email: YES

-- KIOSK USER 2:
-- Email: kiosk2@akta-mmi.com
-- Password: Kiosk123!
-- Confirm email: YES

-- After creating users in Supabase Auth, get their UUIDs and run this:

-- Example (replace with actual UUIDs from Supabase):
/*
-- Insert user records
INSERT INTO users (id, email, role) VALUES
('ADMIN-UUID-HERE', 'admin@akta-mmi.com', 'admin'),
('KIOSK1-UUID-HERE', 'kiosk1@akta-mmi.com', 'kiosk'),
('KIOSK2-UUID-HERE', 'kiosk2@akta-mmi.com', 'kiosk');

-- Insert user roles
INSERT INTO user_roles (user_id, role) VALUES
('ADMIN-UUID-HERE', 'admin'),
('KIOSK1-UUID-HERE', 'kiosk'),
('KIOSK2-UUID-HERE', 'kiosk');

-- Create admin record with Algorand wallet
INSERT INTO admins (user_id, wallet_address) VALUES
('ADMIN-UUID-HERE', 'ALGORAND-WALLET-ADDRESS-HERE');

-- Create demo kiosks
INSERT INTO kiosks (id, name, location, kiosk_code, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Downtown Kiosk', '123 Main St, City', 'KIOSK-001', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Airport Kiosk', '456 Airport Rd, City', 'KIOSK-002', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'Mall Kiosk', '789 Mall Ave, City', 'KIOSK-003', 'active');

-- Link users to kiosks via profiles
INSERT INTO profiles (user_id, kiosk_id, full_name) VALUES
('KIOSK1-UUID-HERE', '550e8400-e29b-41d4-a716-446655440001', 'Kiosk Manager 1'),
('KIOSK2-UUID-HERE', '550e8400-e29b-41d4-a716-446655440002', 'Kiosk Manager 2'),
('ADMIN-UUID-HERE', NULL, 'Admin User');

-- Create demo products
INSERT INTO products (sku, name, unit, unit_price, acquired_price, suggested_price, quantity) VALUES
('PROD-001', 'Water Bottle', 'unit', 2.50, 1.50, 3.00, 1000),
('PROD-002', 'Snack Bar', 'unit', 1.50, 0.75, 2.00, 800),
('PROD-003', 'Soda Can', 'unit', 2.00, 1.00, 2.50, 600),
('PROD-004', 'Chips', 'unit', 1.75, 0.90, 2.25, 500),
('PROD-005', 'Energy Drink', 'unit', 3.50, 2.00, 4.00, 400);

-- Populate kiosk inventory
INSERT INTO kiosk_inventory (kiosk_id, product_id, quantity, threshold) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    id,
    CASE 
        WHEN sku = 'PROD-001' THEN 150
        WHEN sku = 'PROD-002' THEN 80
        WHEN sku = 'PROD-003' THEN 100
        WHEN sku = 'PROD-004' THEN 60
        WHEN sku = 'PROD-005' THEN 40
    END,
    20
FROM products;

INSERT INTO kiosk_inventory (kiosk_id, product_id, quantity, threshold)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    id,
    CASE 
        WHEN sku = 'PROD-001' THEN 50
        WHEN sku = 'PROD-002' THEN 120
        WHEN sku = 'PROD-003' THEN 40
        WHEN sku = 'PROD-004' THEN 90
        WHEN sku = 'PROD-005' THEN 80
    END,
    20
FROM products;

INSERT INTO kiosk_inventory (kiosk_id, product_id, quantity, threshold)
SELECT 
    '550e8400-e29b-41d4-a716-446655440003',
    id,
    CASE 
        WHEN sku = 'PROD-001' THEN 100
        WHEN sku = 'PROD-002' THEN 100
        WHEN sku = 'PROD-003' THEN 80
        WHEN sku = 'PROD-004' THEN 70
        WHEN sku = 'PROD-005' THEN 60
    END,
    20
FROM products;
*/
