-- Migration: Update Digital Only Plan Title and Description
-- Created: 2025-10-30
-- Purpose: Change "Digital Profile Only" to "Free" with new marketing description

-- Update the digital-only subscription plan
UPDATE subscription_plans
SET
  name = 'Free',
  description = 'Your professional identity - simple, shareable, sustainable.'
WHERE type = 'digital-only';

-- Verify the update
SELECT id, name, description, type
FROM subscription_plans
WHERE type = 'digital-only';
