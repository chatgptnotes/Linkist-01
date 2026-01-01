-- ==========================================
-- FIX PROFILES TABLE - Add All Missing Columns
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS sub_domain TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_summary TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS display_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_email TEXT,
ADD COLUMN IF NOT EXISTS alternate_email TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS custom_url TEXT,
ADD COLUMN IF NOT EXISTS profile_url TEXT;

-- Create index on custom_url for performance
CREATE INDEX IF NOT EXISTS idx_profiles_custom_url ON profiles(custom_url);

-- Create unique index on custom_url to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_url_unique ON profiles(custom_url) WHERE custom_url IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Profiles table schema updated successfully!';
  RAISE NOTICE '📊 Added missing columns for profile builder';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test profile save at /profiles/builder';
  RAISE NOTICE '2. Verify no more schema errors in console';
END $$;
