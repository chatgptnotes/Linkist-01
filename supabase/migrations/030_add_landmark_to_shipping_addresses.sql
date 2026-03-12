-- Add landmark column to shipping_addresses table
ALTER TABLE shipping_addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
