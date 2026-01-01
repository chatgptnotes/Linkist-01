-- =====================================================
-- EMERGENCY FIX: Link ALL NULL user_ids
-- =====================================================
-- Purpose: One-shot fix for ALL profiles with NULL user_id
-- This works even if trigger is broken
-- Safe to run multiple times

-- =====================================================
-- STEP 1: Update existing profiles with NULL user_id
-- =====================================================
DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMERGENCY FIX: Linking NULL user_ids';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Match profiles to users by email (case-insensitive, trimmed)
  UPDATE profiles p
  SET
    user_id = u.id,
    updated_at = NOW()
  FROM users u
  WHERE p.user_id IS NULL
    AND LOWER(TRIM(p.email)) = LOWER(TRIM(u.email));

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE '✅ STEP 1: Linked % profiles to users via email', updated_count;
END $$;

-- =====================================================
-- STEP 2: Create profiles for users without profiles
-- =====================================================
DO $$
DECLARE
  created_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';

  -- Insert profiles for users who don't have any profile yet
  WITH users_needing_profiles AS (
    SELECT u.*
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = u.id
    )
  )
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    phone_number,
    created_at,
    updated_at
  )
  SELECT
    id as user_id,
    email,
    first_name,
    last_name,
    phone_number,
    NOW() as created_at,
    NOW() as updated_at
  FROM users_needing_profiles
  ON CONFLICT (email) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    updated_at = NOW()
  WHERE profiles.user_id IS NULL;

  GET DIAGNOSTICS created_count = ROW_COUNT;

  RAISE NOTICE '✅ STEP 2: Created/updated % profiles for users', created_count;
END $$;

-- =====================================================
-- STEP 3: Handle orphaned profiles (optional)
-- =====================================================
DO $$
DECLARE
  orphaned_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';

  -- Count orphaned profiles (no matching user)
  SELECT COUNT(*) INTO orphaned_count
  FROM profiles p
  WHERE p.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    );

  IF orphaned_count > 0 THEN
    RAISE NOTICE '⚠️  STEP 3: Found % orphaned profiles (no matching user)', orphaned_count;
    RAISE NOTICE '   These profiles cannot be auto-fixed';
    RAISE NOTICE '   Review them manually or delete with:';
    RAISE NOTICE '   DELETE FROM profiles WHERE user_id IS NULL;';
  ELSE
    RAISE NOTICE '✅ STEP 3: No orphaned profiles found';
  END IF;
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
DO $$
DECLARE
  total_profiles INTEGER;
  with_user_id INTEGER;
  without_user_id INTEGER;
  total_users INTEGER;
  users_with_profiles INTEGER;
  success_rate NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO with_user_id FROM profiles WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO without_user_id FROM profiles WHERE user_id IS NULL;
  SELECT COUNT(*) INTO total_users FROM users;

  SELECT COUNT(DISTINCT user_id) INTO users_with_profiles
  FROM profiles WHERE user_id IS NOT NULL;

  IF total_profiles > 0 THEN
    success_rate := ROUND((with_user_id::NUMERIC / total_profiles::NUMERIC) * 100, 2);
  ELSE
    success_rate := 0;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with profiles: %', users_with_profiles;
  RAISE NOTICE '';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles WITH user_id: % (%.2f%%)', with_user_id, success_rate;
  RAISE NOTICE 'Profiles WITHOUT user_id: %', without_user_id;
  RAISE NOTICE '========================================';

  IF without_user_id = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCESS! All profiles have user_id';
    RAISE NOTICE '✅ Database is now consistent';
  ELSIF without_user_id > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Still have % profiles with NULL user_id', without_user_id;
    RAISE NOTICE 'These are likely orphaned (no matching user)';
    RAISE NOTICE '';
    RAISE NOTICE 'To delete orphaned profiles, run:';
    RAISE NOTICE 'DELETE FROM profiles WHERE user_id IS NULL;';
  END IF;

  RAISE NOTICE '';
END $$;

-- =====================================================
-- SHOW SAMPLE RESULTS
-- =====================================================
-- Show successfully linked profiles
SELECT
  '✅ SUCCESSFULLY LINKED (Sample)' as status,
  u.id as user_id,
  u.email as user_email,
  p.id as profile_id,
  p.user_id as profile_user_id,
  p.created_at as profile_created
FROM users u
INNER JOIN profiles p ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 5;

-- Show profiles still with NULL (if any)
SELECT
  '❌ STILL NULL' as status,
  p.id as profile_id,
  p.email,
  p.first_name,
  p.last_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(p.email))
    THEN '⚠️ User exists but email mismatch'
    ELSE '❌ No matching user'
  END as reason
FROM profiles p
WHERE p.user_id IS NULL
ORDER BY p.created_at DESC
LIMIT 10;
