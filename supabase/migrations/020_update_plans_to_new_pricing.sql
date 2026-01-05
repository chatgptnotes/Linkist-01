-- Migration: Update subscription plans to new pricing structure
-- Description: Updates plans to match new pricing:
--   - Free: $0 (digital-only)
--   - Personal: $69 (physical-digital)
--   - Founders Club: $299 (founders-club) - handled separately
--
-- This removes the old "Digital Profile + App Access" plan ($19)
-- and updates existing plans to new names and prices.

-- Step 1: Delete the old "Digital Profile + App Access" plan (digital-with-app)
DELETE FROM subscription_plans WHERE type = 'digital-with-app';

-- Step 2: Update the Free plan (digital-only) to correct $0 pricing
UPDATE subscription_plans
SET
  name = 'Free',
  price = 0,
  description = 'Your professional identity - simple, shareable, sustainable.',
  features = '["Digital profile", "Basic analytics", "Profile customization", "Standard support"]'::jsonb,
  status = 'active',
  popular = false,
  display_order = 1,
  updated_at = NOW()
WHERE type = 'digital-only';

-- Step 3: Update the Physical Card plan (physical-digital) to "Personal" at $69
UPDATE subscription_plans
SET
  name = 'Personal',
  price = 69,
  description = 'Premium NFC business card with digital profile',
  features = '["Premium NFC card", "Unlimited profile updates", "Analytics dashboard", "Custom branding", "Priority support"]'::jsonb,
  status = 'active',
  popular = false,
  display_order = 2,
  updated_at = NOW()
WHERE type = 'physical-digital';

-- Step 4: Update the Founders Club to $299
UPDATE subscription_plans
SET
  name = 'Founders Club',
  price = 299,
  founders_total_price = 299,
  description = 'Exclusive membership with lifetime benefits',
  features = '["Founders Tag on NFC Card", "Exclusive Black Card Colors", "Lifetime 50% Discount", "Priority 24/7 Support", "Early Access to Features"]'::jsonb,
  status = 'active',
  popular = false,
  display_order = 3,
  updated_at = NOW()
WHERE type = 'founders-club';

-- If founders-club doesn't exist, insert it
INSERT INTO subscription_plans (
  name,
  type,
  price,
  gst_percentage,
  vat_percentage,
  description,
  features,
  status,
  popular,
  allowed_countries,
  display_order,
  founders_total_price
)
SELECT
  'Founders Club',
  'founders-club',
  299,
  18,
  5,
  'Exclusive membership with lifetime benefits',
  '["Founders Tag on NFC Card", "Exclusive Black Card Colors", "Lifetime 50% Discount", "Priority 24/7 Support", "Early Access to Features"]'::jsonb,
  'active',
  false,
  '["India", "UAE", "USA", "UK"]'::jsonb,
  3,
  299
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE type = 'founders-club');

-- Verify the update
SELECT id, name, type, price, status, display_order FROM subscription_plans ORDER BY display_order;
