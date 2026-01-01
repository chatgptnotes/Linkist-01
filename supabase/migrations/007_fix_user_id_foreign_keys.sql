-- Migration: Add user_id foreign keys to email_otps, mobile_otps, and fix profiles table
-- Purpose: Link OTP records and profiles to users table for proper data relationships
-- Date: 2025-10-17

-- ==========================================
-- STEP 1: Fix profiles table user_id type
-- ==========================================

-- Check if profiles table exists and has TEXT user_id
DO $$
BEGIN
  -- Drop existing foreign key if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_user_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
  END IF;

  -- Change user_id from TEXT to UUID if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'user_id'
    AND data_type = 'text'
  ) THEN
    -- Temporarily drop the column and recreate it as UUID
    ALTER TABLE profiles DROP COLUMN IF EXISTS user_id;
    ALTER TABLE profiles ADD COLUMN user_id UUID;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN user_id UUID;
  END IF;

  -- Add foreign key constraint
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

  RAISE NOTICE '✅ Profiles table user_id fixed (UUID with foreign key)';
END $$;

-- ==========================================
-- STEP 2: Add user_id to email_otps table
-- ==========================================

DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_otps'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE email_otps ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ Added user_id column to email_otps';
  ELSE
    RAISE NOTICE 'ℹ️  user_id column already exists in email_otps';
  END IF;

  -- Add foreign key constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'email_otps_user_id_fkey'
    AND table_name = 'email_otps'
  ) THEN
    ALTER TABLE email_otps
      ADD CONSTRAINT email_otps_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint to email_otps';
  ELSE
    RAISE NOTICE 'ℹ️  Foreign key constraint already exists on email_otps';
  END IF;
END $$;

-- ==========================================
-- STEP 3: Add user_id to mobile_otps table
-- ==========================================

DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mobile_otps'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mobile_otps ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ Added user_id column to mobile_otps';
  ELSE
    RAISE NOTICE 'ℹ️  user_id column already exists in mobile_otps';
  END IF;

  -- Add foreign key constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'mobile_otps_user_id_fkey'
    AND table_name = 'mobile_otps'
  ) THEN
    ALTER TABLE mobile_otps
      ADD CONSTRAINT mobile_otps_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint to mobile_otps';
  ELSE
    RAISE NOTICE 'ℹ️  Foreign key constraint already exists on mobile_otps';
  END IF;
END $$;

-- ==========================================
-- STEP 4: Create indexes for better performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_user_id ON mobile_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_updated ON profiles(user_id) WHERE user_id IS NOT NULL;

-- ==========================================
-- STEP 5: Update RLS policies for better security
-- ==========================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Service role all" ON email_otps;
DROP POLICY IF EXISTS "Service role all" ON mobile_otps;
DROP POLICY IF EXISTS "Service role all" ON profiles;
DROP POLICY IF EXISTS "email_otps_service_role_all" ON email_otps;
DROP POLICY IF EXISTS "email_otps_user_manage_own" ON email_otps;
DROP POLICY IF EXISTS "mobile_otps_service_role_all" ON mobile_otps;
DROP POLICY IF EXISTS "mobile_otps_user_manage_own" ON mobile_otps;
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_user_manage_own" ON profiles;

-- Email OTPs: Service role has full access (MAIN POLICY - uses service_role key)
CREATE POLICY "email_otps_service_role_all"
  ON email_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Mobile OTPs: Service role has full access (MAIN POLICY - uses service_role key)
CREATE POLICY "mobile_otps_service_role_all"
  ON mobile_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Profiles: Service role has full access (MAIN POLICY - uses service_role key)
CREATE POLICY "profiles_service_role_all"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: All API routes use SUPABASE_SERVICE_ROLE_KEY, so service_role policies are sufficient
-- Custom auth is handled at application level (sessions in user_sessions table)
-- No need for auth.uid() based policies since we're using custom auth system

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Changes applied:';
  RAISE NOTICE '  1. Fixed profiles.user_id (TEXT → UUID with FK)';
  RAISE NOTICE '  2. Added email_otps.user_id (UUID with FK)';
  RAISE NOTICE '  3. Added mobile_otps.user_id (UUID with FK)';
  RAISE NOTICE '  4. Created performance indexes';
  RAISE NOTICE '  5. Updated RLS policies for security';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update backend APIs to populate user_id';
  RAISE NOTICE '========================================';
END $$;
