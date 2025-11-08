-- Fix security issues: Restrict access to kiosks and products tables

-- Drop existing public read policies
DROP POLICY IF EXISTS "Allow public read access to kiosks" ON public.kiosks;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;

-- Create secure policies for kiosks table (requires authentication)
CREATE POLICY "Authenticated users can view kiosks"
ON public.kiosks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert kiosks"
ON public.kiosks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update kiosks"
ON public.kiosks
FOR UPDATE
TO authenticated
USING (true);

-- Create secure policies for products table (requires authentication)
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);