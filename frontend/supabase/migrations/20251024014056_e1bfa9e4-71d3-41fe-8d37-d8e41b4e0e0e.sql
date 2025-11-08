-- Fix critical security issues: Add authentication and role-based policies

-- 1. Fix PUBLIC_DATA_EXPOSURE: Require authentication for business tables
-- Drop existing public read policies
DROP POLICY IF EXISTS "Allow public read access to metrics" ON public.metrics;
DROP POLICY IF EXISTS "Allow public read access to transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public read access to redistributions" ON public.redistributions;
DROP POLICY IF EXISTS "Allow public read access to kiosk_inventory" ON public.kiosk_inventory;

-- Add authenticated read policies
CREATE POLICY "Authenticated users can view metrics" 
ON public.metrics 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can view transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can view redistributions" 
ON public.redistributions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can view kiosk_inventory" 
ON public.kiosk_inventory 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Fix MISSING_RLS: Add write policies for critical tables
-- Metrics (admin only for writes)
CREATE POLICY "Admins can insert metrics" 
ON public.metrics 
FOR INSERT 
TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics" 
ON public.metrics 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Transactions (authenticated users can create)
CREATE POLICY "Authenticated users can create transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated 
USING (true);

-- Redistributions (authenticated users can manage)
CREATE POLICY "Authenticated users can create redistributions" 
ON public.redistributions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update redistributions" 
ON public.redistributions 
FOR UPDATE 
TO authenticated 
USING (true);

-- Kiosk Inventory (authenticated users can manage)
CREATE POLICY "Authenticated users can insert inventory" 
ON public.kiosk_inventory 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory" 
ON public.kiosk_inventory 
FOR UPDATE 
TO authenticated 
USING (true);

-- 3. Fix CLIENT_SIDE_AUTH: Enforce role-based access at database level
-- Products: Only admins can delete
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Kiosks: Kiosk users can only update their own kiosk, admins can update all
DROP POLICY IF EXISTS "Authenticated users can update kiosks" ON public.kiosks;
CREATE POLICY "Users can update their assigned kiosk" 
ON public.kiosks 
FOR UPDATE 
TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  id IN (SELECT kiosk_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Metrics: Only admins can view (restrict from previous broad policy)
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.metrics;
CREATE POLICY "Admins can view metrics" 
ON public.metrics 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));