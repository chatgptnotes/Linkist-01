-- =====================================================
-- DIAGNOSTIC: Identify NULL user_id Issues
-- =====================================================
-- Purpose: Find out WHY profiles have NULL user_id
-- Created: 2025-10-18
-- Run this FIRST to understand the problem

-- =====================================================
-- 1. OVERALL SUMMARY
-- =====================================================
DO $$
DECLARE
  total_profiles INTEGER;
  with_user_id INTEGER;
  without_user_id INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO with_user_id FROM profiles WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO without_user_id FROM profiles WHERE user_id IS NULL;
  SELECT COUNT(*) INTO total_users FROM users;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROFILES TABLE SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles WITH user_id: %', with_user_id;
  RAISE NOTICE 'Profiles WITHOUT user_id (NULL): %', without_user_id;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Total users in users table: %', total_users;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 2. CHECK EMAIL MATCHING
-- =====================================================
-- See which NULL profiles can be matched by email

SELECT
  '2. EMAIL MATCHING ANALYSIS' as section,
  NULL::text as profile_email,
  NULL::text as user_exists,
  NULL::text as user_email,
  NULL::uuid as user_id;

SELECT
  'Profiles with NULL user_id' as section,
  p.email as profile_email,
  CASE
    WHEN u.id IS NOT NULL THEN '✅ User EXISTS'
    ELSE '❌ No matching user'
  END as user_exists,
  u.email as user_email,
  u.id as user_id
FROM profiles p
LEFT JOIN users u ON LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
WHERE p.user_id IS NULL
ORDER BY user_exists DESC, p.email
LIMIT 20;

-- =====================================================
-- 3. EMAIL CASE SENSITIVITY CHECK
-- =====================================================
-- Check if emails differ only in case

SELECT
  '3. CASE SENSITIVITY ISSUES' as section,
  NULL::text as profile_email,
  NULL::text as users_email,
  NULL::text as issue;

SELECT
  'Case mismatch found' as section,
  p.email as profile_email,
  u.email as users_email,
  'Emails match but case differs' as issue
FROM profiles p
INNER JOIN users u ON LOWER(p.email) = LOWER(u.email)
WHERE p.user_id IS NULL
  AND p.email != u.email
LIMIT 10;

-- =====================================================
-- 4. ORPHANED PROFILES (No matching user)
-- =====================================================
-- Profiles that have NO corresponding user

SELECT
  '4. ORPHANED PROFILES (No User)' as section,
  NULL::text as profile_id,
  NULL::text as email,
  NULL::text as first_name,
  NULL::text as created_at;

SELECT
  'Orphaned profile' as section,
  p.id as profile_id,
  p.email,
  p.first_name,
  p.created_at::text
FROM profiles p
WHERE p.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
  )
ORDER BY p.created_at DESC
LIMIT 10;

-- =====================================================
-- 5. USERS WITHOUT PROFILES
-- =====================================================
-- Users that don't have a profile yet

SELECT
  '5. USERS WITHOUT PROFILES' as section,
  NULL::text as user_id,
  NULL::text as email,
  NULL::text as first_name;

SELECT
  'User needs profile' as section,
  u.id as user_id,
  u.email,
  u.first_name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = u.id
)
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- 6. DUPLICATE EMAIL CHECK
-- =====================================================
-- Check if there are duplicate emails in profiles

SELECT
  '6. DUPLICATE EMAILS IN PROFILES' as section,
  NULL::text as email,
  NULL::bigint as count;

SELECT
  'Duplicate found' as section,
  email,
  COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 10;

-- =====================================================
-- 7. RECOMMENDED ACTIONS
-- =====================================================
DO $$
DECLARE
  fixable_count INTEGER;
  orphaned_count INTEGER;
  users_need_profile INTEGER;
BEGIN
  -- Count profiles that CAN be fixed by email matching
  SELECT COUNT(*) INTO fixable_count
  FROM profiles p
  INNER JOIN users u ON LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
  WHERE p.user_id IS NULL;

  -- Count truly orphaned profiles
  SELECT COUNT(*) INTO orphaned_count
  FROM profiles p
  WHERE p.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    );

  -- Count users without profiles
  SELECT COUNT(*) INTO users_need_profile
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RECOMMENDED ACTIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Fixable via email match: % profiles', fixable_count;
  RAISE NOTICE '⚠️  Orphaned (no user): % profiles', orphaned_count;
  RAISE NOTICE '📝 Users need profile: % users', users_need_profile;
  RAISE NOTICE '========================================';

  IF fixable_count > 0 THEN
    RAISE NOTICE '👉 Next: Run manual-fix-null-user-ids.sql';
  END IF;

  IF orphaned_count > 0 THEN
    RAISE NOTICE '⚠️  Warning: % profiles cannot be auto-fixed', orphaned_count;
    RAISE NOTICE '   These profiles have no matching user';
  END IF;

  IF users_need_profile > 0 THEN
    RAISE NOTICE '📝 Note: % users need profiles created', users_need_profile;
  END IF;
END $$;
