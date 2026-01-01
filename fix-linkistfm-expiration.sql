-- ============================================
-- Fix LINKISTFM Voucher Expiration Issue
-- ============================================
-- Problem: Voucher expired on Apr 15, 2025 but today is Oct 28, 2025
-- Solution: Update expiration date to future date
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

-- Step 1: Check current voucher status
SELECT
  code,
  is_active,
  valid_from,
  valid_until,
  CASE
    WHEN valid_until < NOW() THEN '❌ EXPIRED'
    WHEN valid_until >= NOW() THEN '✅ VALID'
    ELSE '⚠️ NO EXPIRATION SET'
  END as status,
  discount_type,
  discount_value,
  max_discount_amount,
  usage_limit,
  used_count,
  user_limit
FROM vouchers
WHERE code = 'LINKISTFM';

-- Step 2: Update the voucher expiration date
UPDATE vouchers
SET
  valid_until = '2026-12-31 23:59:59+00'::timestamp,  -- Extend to end of 2026
  is_active = true,                                   -- Ensure it's active
  updated_at = NOW()
WHERE code = 'LINKISTFM';

-- Step 3: Verify the update worked
SELECT
  code,
  is_active,
  valid_from,
  valid_until,
  CASE
    WHEN valid_until < NOW() THEN '❌ EXPIRED'
    WHEN valid_until >= NOW() THEN '✅ VALID'
    ELSE '⚠️ NO EXPIRATION SET'
  END as status,
  discount_value,
  max_discount_amount,
  updated_at
FROM vouchers
WHERE code = 'LINKISTFM';

-- ============================================
-- Optional: Reset user usage (if needed)
-- ============================================
-- CAUTION: Only run this if you want to allow users to use the voucher again
-- Uncomment the line below to clear usage history:

-- DELETE FROM voucher_usage WHERE voucher_id = (SELECT id FROM vouchers WHERE code = 'LINKISTFM');

-- ============================================
-- Expected Results After Update:
-- ============================================
-- code: LINKISTFM
-- is_active: true
-- valid_from: 2024-10-15 00:00:00+00
-- valid_until: 2026-12-31 23:59:59+00
-- status: ✅ VALID
-- discount_value: 50
-- max_discount_amount: 120
-- ============================================
