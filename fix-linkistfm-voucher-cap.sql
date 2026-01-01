-- Fix LINKISTFM Voucher to Cap Discount at $120
-- This ensures the founding member discount never exceeds the subscription value

-- Update LINKISTFM voucher to add maximum discount cap
UPDATE vouchers
SET
  max_discount_amount = 120,
  description = 'Founding Member Exclusive Discount - Free 1 Year Subscription (up to $120 value)',
  updated_at = NOW()
WHERE code = 'LINKISTFM';

-- Verify the update
SELECT
  code,
  description,
  discount_type,
  discount_value,
  max_discount_amount,
  is_active
FROM vouchers
WHERE code = 'LINKISTFM';
