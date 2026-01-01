-- Migration: Seed Founders Club Plan
-- Description: Insert the Founders Club subscription plan with founders_total_price = $149
-- Pricing: India (18% GST) = $122.18 base + $26.82 tax, Others (5% VAT) = $141.55 base + $7.45 tax

-- First, delete any existing founders-club plan to avoid duplicates
DELETE FROM subscription_plans WHERE type = 'founders-club';

-- Insert the Founders Club plan
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
) VALUES (
  'Founders Club',
  'founders-club',
  0,
  18,
  5,
  'Exclusive Founders Club membership with premium benefits',
  '["Premium Metal NFC Card", "Lifetime App Access", "Priority Support", "Exclusive Features", "Custom Branding"]'::jsonb,
  'active',
  false,
  '["India", "UAE", "USA", "UK"]'::jsonb,
  2,
  149.00
);
