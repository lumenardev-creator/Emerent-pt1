-- Add threshold and auto_request settings to kiosk_inventory
ALTER TABLE public.kiosk_inventory 
ADD COLUMN IF NOT EXISTS threshold numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS auto_request_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.kiosk_inventory.threshold IS 'Minimum stock level before requesting redistribution';
COMMENT ON COLUMN public.kiosk_inventory.auto_request_enabled IS 'Enable automatic redistribution requests when stock falls below threshold';