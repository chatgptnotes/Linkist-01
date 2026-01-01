-- Migration: Add founders_total_price column to subscription_plans
-- Description: Stores the admin-set total price for Founders Club plans.
-- The system back-calculates base price based on region (India 18% GST, Others 5% VAT)

-- Add founders_total_price column
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS founders_total_price DECIMAL(10, 2) DEFAULT NULL;

-- Add comment explaining the column purpose
COMMENT ON COLUMN subscription_plans.founders_total_price IS
  'Total price set by admin for Founders Club plans. System calculates: India (18% GST) = base $82 + tax $18 = $100, Others (5% VAT) = base $95 + tax $5 = $100';
