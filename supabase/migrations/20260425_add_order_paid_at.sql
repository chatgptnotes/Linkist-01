-- Add paid_at column to orders table for tracking actual payment time
-- Used by /orders page to show "Date of Purchase" as the payment timestamp
-- (not the original order-creation timestamp for pending orders).
--
-- Idempotent: safe to run multiple times.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing non-pending orders so historic data still shows a sensible
-- "Date of Purchase" (uses updated_at as the best available proxy for payment time).
UPDATE public.orders
SET paid_at = updated_at
WHERE paid_at IS NULL
  AND status IN ('confirmed', 'production', 'shipped', 'delivered');
