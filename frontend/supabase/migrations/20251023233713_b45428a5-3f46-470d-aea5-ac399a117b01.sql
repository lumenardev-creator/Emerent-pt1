-- Add new columns to products table for advanced inventory management
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS forecasted_daily_requirement numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS acquired_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS mrp numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS suggested_selling_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS over_supply_limit numeric DEFAULT 45,
ADD COLUMN IF NOT EXISTS under_supply_limit numeric DEFAULT 15,
ADD COLUMN IF NOT EXISTS normal_supply_level numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS estimated_market_demand text,
ADD COLUMN IF NOT EXISTS market_demand_distance text DEFAULT '3km',
ADD COLUMN IF NOT EXISTS redistribution_revenue numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS redistribution_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS redistributable_quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS acquired_date timestamp with time zone DEFAULT now();

-- Create kiosk_inventory table for tracking product distribution across kiosks
CREATE TABLE IF NOT EXISTS public.kiosk_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kiosk_id uuid REFERENCES public.kiosks(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(kiosk_id, product_id)
);

-- Enable RLS on kiosk_inventory
ALTER TABLE public.kiosk_inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to kiosk_inventory
CREATE POLICY "Allow public read access to kiosk_inventory"
ON public.kiosk_inventory
FOR SELECT
USING (true);

-- Create trigger for kiosk_inventory updated_at
CREATE TRIGGER update_kiosk_inventory_updated_at
BEFORE UPDATE ON public.kiosk_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample kiosk inventory data
INSERT INTO public.kiosk_inventory (kiosk_id, product_id, quantity, last_updated)
SELECT 
  k.id as kiosk_id,
  p.id as product_id,
  CASE 
    WHEN k.kiosk_code = 'KIOSK002' AND p.name = 'Almond Milk' THEN 28
    WHEN k.kiosk_code = 'KIOSK003' AND p.name = 'Almond Milk' THEN 32
    WHEN k.kiosk_code = 'KIOSK002' AND p.name = 'Almond Milk' THEN 28
    WHEN k.kiosk_code = 'KIOSK001' AND p.name = 'Baby Spinach' THEN 200
    WHEN k.kiosk_code = 'KIOSK003' AND p.name = 'Baby Spinach' THEN 150
    WHEN k.kiosk_code = 'KIOSK002' AND p.name = 'Baby Spinach' THEN 8
    WHEN k.kiosk_code = 'KIOSK003' AND p.name = 'Free-Range Eggs' THEN 35
    WHEN k.kiosk_code = 'KIOSK003' AND p.name = 'Free-Range Eggs' THEN 55
    WHEN k.kiosk_code = 'KIOSK002' AND p.name = 'Free-Range Eggs' THEN 150
    WHEN k.kiosk_code = 'KIOSK001' AND p.name = 'Greek Yogurt' THEN 120
    WHEN k.kiosk_code = 'KIOSK002' AND p.name = 'Greek Yogurt' THEN 15
    WHEN k.kiosk_code = 'KIOSK003' AND p.name = 'Greek Yogurt' THEN 80
    WHEN k.kiosk_code = 'KIOSK001' AND p.name = 'Milk Bread' THEN 12
    ELSE 0
  END as quantity,
  now() - (random() * interval '30 days') as last_updated
FROM public.kiosks k
CROSS JOIN public.products p
WHERE 
  (k.kiosk_code = 'KIOSK002' AND p.name IN ('Almond Milk')) OR
  (k.kiosk_code = 'KIOSK003' AND p.name IN ('Almond Milk')) OR
  (k.kiosk_code = 'KIOSK002' AND p.name IN ('Almond Milk')) OR
  (k.kiosk_code = 'KIOSK001' AND p.name IN ('Baby Spinach')) OR
  (k.kiosk_code = 'KIOSK003' AND p.name IN ('Baby Spinach')) OR
  (k.kiosk_code = 'KIOSK002' AND p.name IN ('Baby Spinach')) OR
  (k.kiosk_code = 'KIOSK003' AND p.name IN ('Free-Range Eggs')) OR
  (k.kiosk_code = 'KIOSK003' AND p.name IN ('Free-Range Eggs')) OR
  (k.kiosk_code = 'KIOSK002' AND p.name IN ('Free-Range Eggs')) OR
  (k.kiosk_code = 'KIOSK001' AND p.name IN ('Greek Yogurt')) OR
  (k.kiosk_code = 'KIOSK002' AND p.name IN ('Greek Yogurt')) OR
  (k.kiosk_code = 'KIOSK003' AND p.name IN ('Greek Yogurt')) OR
  (k.kiosk_code = 'KIOSK001' AND p.name IN ('Milk Bread'))
ON CONFLICT (kiosk_id, product_id) DO NOTHING;

-- Update products with enhanced data
UPDATE public.products
SET 
  forecasted_daily_requirement = 30,
  acquired_price = 95,
  mrp = 95,
  suggested_selling_price = 95,
  over_supply_limit = 40,
  under_supply_limit = 20,
  normal_supply_level = 30,
  estimated_market_demand = '25liters needed within 3km',
  redistribution_revenue = 4560,
  redistribution_cost = 0,
  redistributable_quantity = 48,
  depletion_rate = 'Medium'
WHERE name = 'Almond Milk';

UPDATE public.products
SET 
  forecasted_daily_requirement = 120,
  acquired_price = 45,
  mrp = 50,
  suggested_selling_price = 50,
  over_supply_limit = 180,
  under_supply_limit = 60,
  normal_supply_level = 120,
  estimated_market_demand = '200bags needed within 2km',
  redistribution_revenue = 18000,
  redistribution_cost = 0,
  redistributable_quantity = 200,
  depletion_rate = 'High'
WHERE name = 'Baby Spinach';

UPDATE public.products
SET 
  forecasted_daily_requirement = 80,
  acquired_price = 180,
  mrp = 200,
  suggested_selling_price = 200,
  over_supply_limit = 120,
  under_supply_limit = 40,
  normal_supply_level = 80,
  estimated_market_demand = '150dozen needed within 2.5km',
  redistribution_revenue = 30000,
  redistribution_cost = 500,
  redistributable_quantity = 150,
  depletion_rate = 'Medium'
WHERE name = 'Free-Range Eggs';

UPDATE public.products
SET 
  forecasted_daily_requirement = 70,
  acquired_price = 65,
  mrp = 75,
  suggested_selling_price = 75,
  over_supply_limit = 105,
  under_supply_limit = 35,
  normal_supply_level = 70,
  estimated_market_demand = '120containers needed within 2km',
  redistribution_revenue = 9000,
  redistribution_cost = 200,
  redistributable_quantity = 120,
  depletion_rate = 'High'
WHERE name = 'Greek Yogurt';

UPDATE public.products
SET 
  forecasted_daily_requirement = 30,
  acquired_price = 20,
  mrp = 20,
  suggested_selling_price = 20,
  over_supply_limit = 16,
  under_supply_limit = 8,
  normal_supply_level = 30,
  estimated_market_demand = '25loaves needed within 3km',
  redistribution_revenue = 500,
  redistribution_cost = 0,
  redistributable_quantity = 25,
  depletion_rate = 'Medium'
WHERE name = 'Milk Bread';