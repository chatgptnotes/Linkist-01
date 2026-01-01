-- Add founding member fields to users table
-- Migration: 009_add_founding_member_fields

-- Add founding member flag
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false;

-- Add registration date for founding member calculation (using created_at)
-- Add founding member joined date
ALTER TABLE users
ADD COLUMN IF NOT EXISTS founding_member_since TIMESTAMP WITH TIME ZONE;

-- Add founding member plan type (lifetime, annual, monthly)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS founding_member_plan TEXT
CHECK (founding_member_plan IN ('lifetime', 'annual', 'monthly', NULL));

-- Make phone_number unique to prevent multiple accounts with same phone
-- First, we need to handle existing duplicate phone numbers
-- Update NULL phone numbers to make them unique (temporary)
UPDATE users
SET phone_number = NULL
WHERE phone_number = '' OR phone_number IS NULL;

-- Now add unique constraint (allows multiple NULLs but no duplicate values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
ON users(phone_number)
WHERE phone_number IS NOT NULL;

-- Create index for founding member queries
CREATE INDEX IF NOT EXISTS idx_users_founding_member ON users(is_founding_member);

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Add system setting for launch date
INSERT INTO system_settings (key, value, description, category, is_public, updated_at)
VALUES (
  'founding_member_launch_date',
  '"2024-10-15T00:00:00Z"'::jsonb,
  'Launch date for founding member program - members who register within 6 months are eligible',
  'founding_member',
  false,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Add system setting for founding member end date (6 months from launch)
INSERT INTO system_settings (key, value, description, category, is_public, updated_at)
VALUES (
  'founding_member_end_date',
  '"2025-04-15T00:00:00Z"'::jsonb,
  'End date for founding member program',
  'founding_member',
  false,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Create function to check if user is eligible for founding member
CREATE OR REPLACE FUNCTION is_founding_member_eligible(user_created_at TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
DECLARE
  launch_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get launch and end dates from system settings
  SELECT (value::text)::timestamp with time zone INTO launch_date
  FROM system_settings WHERE key = 'founding_member_launch_date';

  SELECT (value::text)::timestamp with time zone INTO end_date
  FROM system_settings WHERE key = 'founding_member_end_date';

  -- Check if user registered within the founding member period
  RETURN user_created_at >= launch_date AND user_created_at <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN users.is_founding_member IS 'Whether user is a founding member (registered within first 6 months)';
COMMENT ON COLUMN users.founding_member_since IS 'Date when user became a founding member';
COMMENT ON COLUMN users.founding_member_plan IS 'Type of founding member plan: lifetime, annual, or monthly';
COMMENT ON INDEX idx_users_phone_unique IS 'Ensures phone numbers are unique across accounts (one account per phone)';
