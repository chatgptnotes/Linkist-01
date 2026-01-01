-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('physical-digital', 'digital-with-app', 'digital-only')),
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  gst_percentage DECIMAL(5, 2) NOT NULL DEFAULT 18.00 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
  vat_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (vat_percentage >= 0 AND vat_percentage <= 100),
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
  popular BOOLEAN NOT NULL DEFAULT false,
  allowed_countries JSONB NOT NULL DEFAULT '["India", "UAE", "USA", "UK"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON subscription_plans(status);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON subscription_plans(type);

-- Insert default plans (matching the screenshot)
INSERT INTO subscription_plans (name, type, price, gst_percentage, vat_percentage, description, features, status, popular, allowed_countries)
VALUES
  (
    'Physical Card + Digital Profile',
    'physical-digital',
    29.00,
    18.00,
    5.00,
    'Premium NFC business card with digital profile',
    '["Premium NFC card", "Unlimited profile updates", "Analytics dashboard", "Custom branding", "Priority support"]'::jsonb,
    'active',
    false,
    '["India", "UAE", "USA", "UK"]'::jsonb
  ),
  (
    'Digital Profile + App Access',
    'digital-with-app',
    19.00,
    18.00,
    5.00,
    'Digital profile with mobile app access',
    '["Digital profile", "Mobile app access", "Profile analytics", "Custom design", "Email support"]'::jsonb,
    'active',
    true,
    '["India", "UAE", "USA", "UK"]'::jsonb
  ),
  (
    'Free',
    'digital-only',
    9.00,
    18.00,
    5.00,
    'Your professional identity - simple, shareable, sustainable.',
    '["Digital profile", "Basic analytics", "Profile customization", "Standard support"]'::jsonb,
    'active',
    false,
    '["India", "UAE", "USA", "UK"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
