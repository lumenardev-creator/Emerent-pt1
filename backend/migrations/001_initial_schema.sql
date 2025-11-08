-- =====================================================
-- AKTA MMI - Complete Database Schema
-- Blockchain-Integrated Inventory Redistribution System
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles enum
CREATE TYPE app_role AS ENUM ('admin', 'kiosk');

-- Redistribution status enum
CREATE TYPE redistribution_status AS ENUM (
  'requested',
  'approved', 
  'submitted',
  'fulfilled',
  'reconciled',
  'failed',
  'timed_out'
);

-- Command status enum
CREATE TYPE command_status AS ENUM (
  'pending',
  'processing',
  'submitted',
  'completed',
  'failed'
);

-- Transaction status enum
CREATE TYPE transaction_status AS ENUM (
  'pending',
  'confirmed',
  'failed'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table (with Algorand wallet)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kiosks table
CREATE TABLE IF NOT EXISTS kiosks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  kiosk_code TEXT UNIQUE NOT NULL,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  auto_approve BOOLEAN DEFAULT FALSE,
  inventory JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  acquired_price NUMERIC(10, 2),
  suggested_price NUMERIC(10, 2),
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kiosk Inventory table
CREATE TABLE IF NOT EXISTS kiosk_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER DEFAULT 10,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kiosk_id, product_id)
);

-- Redistributions table (updated with blockchain fields)
CREATE TABLE IF NOT EXISTS redistributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  to_kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  status redistribution_status DEFAULT 'requested',
  items JSONB NOT NULL, -- [{sku, quantity, price}]
  pricing JSONB, -- {oversupply_discount, undersupply_premium, total}
  blockchain_ref TEXT, -- Format: "algo:testnet:txid"
  txid TEXT, -- Transaction ID
  client_req_id TEXT NOT NULL,
  signature TEXT, -- Ed25519 signature (base64)
  public_key TEXT, -- Ed25519 public key (base64)
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Blockchain Commands table
CREATE TABLE IF NOT EXISTS blockchain_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  client_req_id TEXT NOT NULL,
  command_type TEXT NOT NULL, -- 'approve_redistribution'
  payload JSONB NOT NULL,
  status command_status DEFAULT 'pending',
  redistribution_id UUID NOT NULL REFERENCES redistributions(id) ON DELETE CASCADE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(user_id, client_req_id)
);

-- Blockchain Transactions table
CREATE TABLE IF NOT EXISTS blockchain_txns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  command_id UUID NOT NULL REFERENCES blockchain_commands(id) ON DELETE CASCADE,
  redistribution_id UUID NOT NULL REFERENCES redistributions(id) ON DELETE CASCADE,
  txid TEXT UNIQUE NOT NULL,
  chain TEXT NOT NULL DEFAULT 'algorand',
  chain_id TEXT NOT NULL, -- 'testnet' or 'mainnet'
  status transaction_status DEFAULT 'pending',
  block BIGINT,
  confirmed_round BIGINT,
  fee NUMERIC(18, 6), -- In ALGOs
  blockchain_ref TEXT NOT NULL, -- Format: "algo:testnet:txid"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Profiles table (for additional user metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  kiosk_id UUID REFERENCES kiosks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles table (for RLS policies)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Redistributions indexes
CREATE INDEX idx_redistributions_status ON redistributions(status);
CREATE INDEX idx_redistributions_from_kiosk ON redistributions(from_kiosk_id);
CREATE INDEX idx_redistributions_to_kiosk ON redistributions(to_kiosk_id);
CREATE INDEX idx_redistributions_txid ON redistributions(txid);
CREATE INDEX idx_redistributions_blockchain_ref ON redistributions(blockchain_ref);
CREATE INDEX idx_redistributions_client_req_id ON redistributions(client_req_id);
CREATE INDEX idx_redistributions_created_by ON redistributions(created_by);

-- Commands indexes
CREATE INDEX idx_commands_status ON blockchain_commands(status);
CREATE INDEX idx_commands_user_id ON blockchain_commands(user_id);
CREATE INDEX idx_commands_redistribution_id ON blockchain_commands(redistribution_id);

-- Transactions indexes
CREATE INDEX idx_txns_txid ON blockchain_txns(txid);
CREATE INDEX idx_txns_status ON blockchain_txns(status);
CREATE INDEX idx_txns_command_id ON blockchain_txns(command_id);
CREATE INDEX idx_txns_redistribution_id ON blockchain_txns(redistribution_id);
CREATE INDEX idx_txns_confirmed_round ON blockchain_txns(confirmed_round);

-- Kiosk inventory indexes
CREATE INDEX idx_kiosk_inventory_kiosk_id ON kiosk_inventory(kiosk_id);
CREATE INDEX idx_kiosk_inventory_product_id ON kiosk_inventory(product_id);

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_kiosk_id ON profiles(kiosk_id);

-- Admins indexes
CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_wallet_address ON admins(wallet_address);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE redistributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Redistributions RLS Policies
-- Admins can see all redistributions
CREATE POLICY "Admins can view all redistributions"
  ON redistributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Kiosks can only see redistributions where they are from_kiosk or to_kiosk
CREATE POLICY "Kiosks can view their own redistributions"
  ON redistributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND (
        profiles.kiosk_id = redistributions.from_kiosk_id
        OR profiles.kiosk_id = redistributions.to_kiosk_id
      )
    )
  );

-- Kiosks can insert redistributions
CREATE POLICY "Kiosks can create redistributions"
  ON redistributions FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'kiosk'
    )
  );

-- Admins can update redistributions
CREATE POLICY "Admins can update redistributions"
  ON redistributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Blockchain Commands RLS Policies
CREATE POLICY "Users can view their own commands"
  ON blockchain_commands FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all commands"
  ON blockchain_commands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Blockchain Transactions RLS Policies
CREATE POLICY "Admins can view all transactions"
  ON blockchain_txns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Kiosks can view their redistribution transactions"
  ON blockchain_txns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM redistributions r
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE r.id = blockchain_txns.redistribution_id
      AND (p.kiosk_id = r.from_kiosk_id OR p.kiosk_id = r.to_kiosk_id)
    )
  );

-- Kiosks RLS Policies
CREATE POLICY "Admins can view all kiosks"
  ON kiosks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Kiosks can view their own kiosk"
  ON kiosks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.kiosk_id = kiosks.id
    )
  );

-- Products RLS (all authenticated users can read)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Profiles RLS
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_redistributions_updated_at
  BEFORE UPDATE ON redistributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kiosks_updated_at
  BEFORE UPDATE ON kiosks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commands_updated_at
  BEFORE UPDATE ON blockchain_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check user role
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA (Optional for testing)
-- =====================================================

-- Note: Actual user creation should be done via Supabase Auth
-- This is just example structure

COMMENT ON TABLE redistributions IS 'Stores inventory redistribution requests with blockchain attestation';
COMMENT ON TABLE blockchain_commands IS 'Queue for blockchain operations to be processed by worker';
COMMENT ON TABLE blockchain_txns IS 'Stores blockchain transaction details and confirmation status';
COMMENT ON TABLE admins IS 'Admin users with Algorand wallet addresses for blockchain signing';
COMMENT ON TABLE kiosks IS 'Physical/virtual kiosk locations with inventory';
