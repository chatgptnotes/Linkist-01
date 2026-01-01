-- Migration: Add founders-club type to subscription_plans
-- Description: Adds 'founders-club' as a valid plan type option

-- Drop the existing CHECK constraint on type column
ALTER TABLE subscription_plans
DROP CONSTRAINT IF EXISTS subscription_plans_type_check;

-- Add updated CHECK constraint with founders-club type
ALTER TABLE subscription_plans
ADD CONSTRAINT subscription_plans_type_check
CHECK (type IN ('physical-digital', 'digital-with-app', 'digital-only', 'founders-club'));
