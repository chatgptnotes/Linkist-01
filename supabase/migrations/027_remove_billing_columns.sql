-- Migration: Remove monthly/yearly billing columns
-- Pricing is now a single fixed price per plan (using the yearly_price values)
-- The 'price' column becomes the single source of truth for plan pricing

-- Step 1: Set price = yearly_price for all plans that have a yearly_price
UPDATE subscription_plans
SET price = yearly_price, updated_at = NOW()
WHERE yearly_price IS NOT NULL AND yearly_price > 0;

-- Step 2: Drop the monthly/yearly columns
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS monthly_price;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS yearly_price;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS yearly_discount_percent;

-- Verify
SELECT name, type, price, founders_total_price FROM subscription_plans ORDER BY display_order;
