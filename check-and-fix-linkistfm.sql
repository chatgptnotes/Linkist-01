-- Check current LINKISTFM voucher configuration
SELECT
  code,
  description,
  discount_type,
  discount_value,
  max_discount_amount,
  min_order_value,
  is_active,
  user_limit,
  usage_limit
FROM vouchers
WHERE code = 'LINKISTFM';

-- Fix LINKISTFM voucher to be:
-- - 50% percentage discount
-- - Capped at $120 maximum
UPDATE vouchers
SET
  discount_type = 'percentage',
  discount_value = 50,
  max_discount_amount = 120,
  description = 'Founding Member Exclusive - Free 1 Year Subscription (up to $120 value)',
  updated_at = NOW()
WHERE code = 'LINKISTFM';

-- Verify the fix
SELECT
  code,
  discount_type,
  discount_value,
  max_discount_amount,
  description
FROM vouchers
WHERE code = 'LINKISTFM';
