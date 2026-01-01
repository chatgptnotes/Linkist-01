-- Add user_id to voucher_usage for better tracking
-- Migration: 010_add_voucher_user_tracking

-- Add user_id column if not exists
ALTER TABLE voucher_usage
ADD COLUMN IF NOT EXISTS user_id_from_users UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_id ON voucher_usage(user_id_from_users);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_email ON voucher_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_user ON voucher_usage(voucher_id, user_id_from_users);

-- Create function to check if user has already used a voucher
CREATE OR REPLACE FUNCTION has_user_used_voucher(
  p_voucher_code TEXT,
  p_user_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_voucher_id UUID;
  v_usage_count INTEGER;
BEGIN
  -- Get voucher ID from code
  SELECT id INTO v_voucher_id
  FROM vouchers
  WHERE code = p_voucher_code;

  IF v_voucher_id IS NULL THEN
    RETURN FALSE; -- Voucher doesn't exist
  END IF;

  -- Check usage by email or user_id
  SELECT COUNT(*) INTO v_usage_count
  FROM voucher_usage
  WHERE voucher_id = v_voucher_id
    AND (
      (p_user_email IS NOT NULL AND user_email = p_user_email)
      OR (p_user_id IS NOT NULL AND user_id_from_users = p_user_id)
    );

  RETURN v_usage_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create vouchers table if not exists
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voucher_usage table if not exists
CREATE TABLE IF NOT EXISTS voucher_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  order_id UUID,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active);

-- Create LINKISTFM voucher if it doesn't exist
INSERT INTO vouchers (
  code,
  description,
  discount_type,
  discount_value,
  min_order_value,
  max_discount_amount,
  usage_limit,
  user_limit,
  valid_from,
  valid_until,
  is_active
)
VALUES (
  'LINKISTFM',
  'Founding Member Exclusive Discount - Free 1 Year Subscription (up to $120 value)',
  'percentage',
  50,
  0,
  120, -- Cap discount at $120 (subscription value)
  NULL, -- Unlimited total usage
  1,    -- One per user
  COALESCE(
    (SELECT (value#>>'{}')::timestamp FROM system_settings WHERE key = 'founding_member_launch_date'),
    '2024-10-15 00:00:00+00'::timestamp
  ),
  COALESCE(
    (SELECT (value#>>'{}')::timestamp FROM system_settings WHERE key = 'founding_member_end_date'),
    '2025-04-15 00:00:00+00'::timestamp
  ),
  true
)
ON CONFLICT (code) DO UPDATE
SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  max_discount_amount = EXCLUDED.max_discount_amount,
  user_limit = EXCLUDED.user_limit,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Add comment for documentation
COMMENT ON FUNCTION has_user_used_voucher IS 'Check if a user has already used a specific voucher code';
COMMENT ON COLUMN voucher_usage.user_id_from_users IS 'Reference to users table for tracking voucher usage per account';
