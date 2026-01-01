-- Migration: Fix existing NULL user_id values in profiles table
-- Purpose: Link existing profiles to their corresponding users based on email match
-- Date: 2025-10-17

-- ==========================================
-- STEP 1: Backup check - Show current state
-- ==========================================

DO $$
DECLARE
  null_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM profiles WHERE user_id IS NULL;
  SELECT COUNT(*) INTO total_count FROM profiles;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 BEFORE FIX - Current Status:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_count;
  RAISE NOTICE 'NULL user_ids: %', null_count;
  RAISE NOTICE 'Valid user_ids: %', (total_count - null_count);
  RAISE NOTICE '';
END $$;

-- ==========================================
-- STEP 2: Update NULL user_ids by matching email
-- ==========================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update profiles where user_id is NULL by matching email with users table
  WITH updated AS (
    UPDATE profiles p
    SET user_id = u.id
    FROM users u
    WHERE p.email = u.email
      AND p.user_id IS NULL
    RETURNING p.id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ UPDATE COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Records updated: %', updated_count;
  RAISE NOTICE '';
END $$;

-- ==========================================
-- STEP 3: Verification - Show fixed state
-- ==========================================

DO $$
DECLARE
  null_count INTEGER;
  valid_count INTEGER;
  total_count INTEGER;
  orphan_count INTEGER;
BEGIN
  -- Count current state
  SELECT COUNT(*) INTO null_count FROM profiles WHERE user_id IS NULL;
  SELECT COUNT(*) INTO valid_count FROM profiles WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO total_count FROM profiles;

  -- Count orphaned profiles (profiles with no matching user)
  SELECT COUNT(*) INTO orphan_count
  FROM profiles p
  WHERE user_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = p.email);

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 AFTER FIX - Final Status:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_count;
  RAISE NOTICE 'Fixed (valid user_ids): %', valid_count;
  RAISE NOTICE 'Still NULL: %', null_count;

  IF null_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: % profiles still have NULL user_id', null_count;
    RAISE NOTICE 'These profiles don''t have matching users in users table.';
    RAISE NOTICE 'Orphaned profiles: %', orphan_count;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: All profiles now have valid user_ids!';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- STEP 4: Show sample of fixed records
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 SAMPLE OF FIXED RECORDS:';
  RAISE NOTICE '========================================';
END $$;

-- Show first 5 fixed records
SELECT
  LEFT(id::TEXT, 8) || '...' as profile_id,
  LEFT(user_id::TEXT, 8) || '...' as user_id,
  email,
  first_name,
  CASE
    WHEN user_id IS NOT NULL THEN '✅ Fixed'
    ELSE '❌ NULL'
  END as status
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- STEP 5: List any orphaned profiles (if any)
-- ==========================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM profiles p
  WHERE user_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  ORPHANED PROFILES (No matching user):';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'These profiles need manual review:';
    RAISE NOTICE '';
  END IF;
END $$;

-- Show orphaned profiles (if any)
SELECT
  LEFT(id::TEXT, 8) || '...' as profile_id,
  email,
  first_name,
  last_name,
  '❌ No matching user' as issue
FROM profiles
WHERE user_id IS NULL
LIMIT 10;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 008 completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Summary:';
  RAISE NOTICE '  - Updated profiles.user_id by matching emails';
  RAISE NOTICE '  - Linked existing profiles to users table';
  RAISE NOTICE '  - Fixed NULL foreign key references';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review any orphaned profiles above';
  RAISE NOTICE '  2. Test new profile creation';
  RAISE NOTICE '  3. Verify user_id populates correctly';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
