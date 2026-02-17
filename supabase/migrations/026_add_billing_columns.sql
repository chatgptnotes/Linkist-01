-- Migration: Fix yearly_price to store annual totals instead of per-month rates
-- The yearly_price column was storing monthly-equivalent prices (e.g., $5.5/mo)
-- but should store the full annual price (e.g., $69/year)

UPDATE subscription_plans
SET yearly_price = 0, updated_at = NOW()
WHERE type = 'starter';

UPDATE subscription_plans
SET yearly_price = 69, updated_at = NOW()
WHERE type = 'next';

UPDATE subscription_plans
SET yearly_price = 99, updated_at = NOW()
WHERE type = 'pro';

UPDATE subscription_plans
SET yearly_price = 129, updated_at = NOW()
WHERE type = 'signature';

UPDATE subscription_plans
SET yearly_price = 149, updated_at = NOW()
WHERE type = 'founders-circle';

-- Fix Founder's Circle total price (was showing $99 instead of $149)
UPDATE subscription_plans
SET founders_total_price = 149, updated_at = NOW()
WHERE type = 'founders-circle';

-- Also update legacy founders-club plan if it exists
UPDATE subscription_plans
SET founders_total_price = 149, updated_at = NOW()
WHERE type = 'founders-club';

-- Verify
SELECT name, type, monthly_price, yearly_price, founders_total_price FROM subscription_plans ORDER BY display_order;
