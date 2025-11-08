-- Create products table for inventory management
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  supply_level NUMERIC DEFAULT 100,
  status TEXT DEFAULT 'Apt supply',
  eligible_for_redistribution BOOLEAN DEFAULT false,
  depletion_rate TEXT DEFAULT 'Medium depletion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create kiosks table
CREATE TABLE public.kiosks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kiosk_code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  manager_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Active',
  total_items INTEGER DEFAULT 0,
  sku_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create redistributions table
CREATE TABLE public.redistributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  from_kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  to_kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium Priority',
  status TEXT DEFAULT 'pending',
  reason TEXT,
  value_recovered NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id TEXT UNIQUE NOT NULL,
  redistribution_id UUID REFERENCES public.redistributions(id) ON DELETE SET NULL,
  from_kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  to_kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  value NUMERIC DEFAULT 0,
  blockchain_ref TEXT DEFAULT '0xDummyHash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create metrics table for tracking changes
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_percentage NUMERIC,
  change_amount NUMERIC,
  period TEXT DEFAULT 'daily',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redistributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read for now, can be restricted later with auth)
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to kiosks"
  ON public.kiosks FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to redistributions"
  ON public.redistributions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to transactions"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to metrics"
  ON public.metrics FOR SELECT
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kiosks_updated_at
  BEFORE UPDATE ON public.kiosks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.products (name, sku, quantity, unit, unit_price, supply_level, eligible_for_redistribution, depletion_rate) VALUES
  ('Almond Milk', 'SKU001', 88, 'liters', 45, 100, true, 'Medium depletion'),
  ('Baby Spinach', 'SKU002', 358, 'bags', 25, 100, true, 'High depletion'),
  ('Free-Range Eggs', 'SKU003', 245, 'dozen', 80, 85, true, 'Low depletion'),
  ('Organic Tomatoes', 'SKU004', 156, 'kg', 60, 65, true, 'Medium depletion');

INSERT INTO public.kiosks (name, kiosk_code, address, manager_name, email, phone, status, total_items, sku_count) VALUES
  ('Downtown Fresh Market', 'KIOSK001', '123 Main Street, Downtown, City 12345', 'John Doe', 'kiosk001@akta.com', '+91 98765 43210', 'Active', 632, 10),
  ('Mall Central Kiosk', 'KIOSK002', '456 Shopping Ave, Mall Central, City 12346', 'Jane Smith', 'kiosk002@akta.com', '+91 98765 43211', 'Active', 456, 9),
  ('University Corner Store', 'KIOSK003', '789 Airport Rd, Terminal B, City 12347', 'Mike Johnson', 'kiosk003@akta.com', '+91 98765 43212', 'Inactive', 457, 9);

INSERT INTO public.redistributions (product_id, from_kiosk_id, to_kiosk_id, quantity, unit, status, value_recovered, completed_at) VALUES
  ((SELECT id FROM public.products WHERE sku = 'SKU001'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK001'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK002'), 8, 'liters', 'completed', 360, now() - interval '38 days'),
  ((SELECT id FROM public.products WHERE sku = 'SKU001'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK001'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK002'), 10, 'liters', 'completed', 450, now() - interval '49 days'),
  ((SELECT id FROM public.products WHERE sku = 'SKU003'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK002'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK001'), 20, 'dozen', 'completed', 1600, now() - interval '137 days');

INSERT INTO public.transactions (tx_id, from_kiosk_id, to_kiosk_id, product_id, quantity, unit, status, value) VALUES
  ('a9f3e17b-4b39-4780-a881-cfdce1231df6', (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK002'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK001'), (SELECT id FROM public.products WHERE sku = 'SKU001'), 20, 'liters', 'pending', 900),
  ('718cb165-3f53-48ff-bfd7-a0e6fbd65e77', (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK002'), (SELECT id FROM public.kiosks WHERE kiosk_code = 'KIOSK001'), (SELECT id FROM public.products WHERE sku = 'SKU001'), 8, 'liters', 'completed', 360);

INSERT INTO public.metrics (metric_type, current_value, previous_value, change_percentage, change_amount) VALUES
  ('total_skus', 28, 27, 3.7, 1),
  ('total_value', 290000, 276190, 5, 13810),
  ('monthly_revenue', 45700, 37500, 21.9, 8200);
