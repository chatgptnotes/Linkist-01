-- =====================================================
-- CHECK TRIGGER STATUS
-- =====================================================
-- Purpose: Verify trigger is working or not
-- Run this FIRST to diagnose trigger issues

-- =====================================================
-- 1. CHECK IF TRIGGER EXISTS
-- =====================================================
SELECT
  '🔍 TRIGGER EXISTS?' as check_type,
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation,
  CASE
    WHEN trigger_schema IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_profile'
  AND event_object_table = 'users';

-- =====================================================
-- 2. CHECK IF FUNCTION EXISTS
-- =====================================================
SELECT
  '🔍 FUNCTION EXISTS?' as check_type,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'create_profile_for_new_user';

-- =====================================================
-- 3. CHECK RECENT USERS AND THEIR PROFILES
-- =====================================================
SELECT
  '📊 RECENT USERS vs PROFILES' as check_type,
  u.id as user_id,
  u.email as user_email,
  u.created_at as user_created,
  p.id as profile_id,
  p.user_id as profile_user_id,
  CASE
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.user_id IS NULL THEN '⚠️ PROFILE EXISTS BUT user_id NULL'
    WHEN p.user_id = u.id THEN '✅ CORRECTLY LINKED'
    ELSE '❓ LINKED TO DIFFERENT USER'
  END as status
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id OR u.email = p.email
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- 4. CHECK FOR DUPLICATE EMAILS
-- =====================================================
SELECT
  '⚠️ DUPLICATE EMAIL CONFLICTS' as check_type,
  email,
  COUNT(*) as profile_count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- =====================================================
-- 5. CHECK CONSTRAINT VIOLATIONS
-- =====================================================
SELECT
  '🔒 CHECK CONSTRAINTS' as check_type,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname LIKE '%user%';

-- =====================================================
-- 6. SUMMARY AND DIAGNOSIS
-- =====================================================
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
  total_users INTEGER;
  users_with_profile INTEGER;
  users_without_profile INTEGER;
  profiles_with_null_user_id INTEGER;
BEGIN
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_auto_create_profile'
  ) INTO trigger_exists;

  -- Check function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_profile_for_new_user'
  ) INTO function_exists;

  -- Get stats
  SELECT COUNT(*) INTO total_users FROM users;

  SELECT COUNT(DISTINCT u.id) INTO users_with_profile
  FROM users u
  INNER JOIN profiles p ON u.id = p.user_id;

  users_without_profile := total_users - users_with_profile;

  SELECT COUNT(*) INTO profiles_with_null_user_id
  FROM profiles WHERE user_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRIGGER DIAGNOSTIC REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. TRIGGER STATUS:';
  IF trigger_exists THEN
    RAISE NOTICE '   ✅ Trigger EXISTS';
  ELSE
    RAISE NOTICE '   ❌ Trigger MISSING - Need to create it';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '2. FUNCTION STATUS:';
  IF function_exists THEN
    RAISE NOTICE '   ✅ Function EXISTS';
  ELSE
    RAISE NOTICE '   ❌ Function MISSING - Need to create it';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '3. DATA STATUS:';
  RAISE NOTICE '   Total users: %', total_users;
  RAISE NOTICE '   Users WITH profiles: %', users_with_profile;
  RAISE NOTICE '   Users WITHOUT profiles: %', users_without_profile;
  RAISE NOTICE '   Profiles with NULL user_id: %', profiles_with_null_user_id;

  RAISE NOTICE '';
  RAISE NOTICE '4. DIAGNOSIS:';

  IF NOT trigger_exists OR NOT function_exists THEN
    RAISE NOTICE '   ❌ CRITICAL: Trigger/Function missing!';
    RAISE NOTICE '   👉 Run: auto-create-profile-trigger.sql';
  ELSIF users_without_profile > 0 THEN
    RAISE NOTICE '   ⚠️ WARNING: % users have no profiles', users_without_profile;
    RAISE NOTICE '   👉 Trigger not creating profiles for new users';
    RAISE NOTICE '   👉 Possible issue: Duplicate email constraint';
  ELSIF profiles_with_null_user_id > 0 THEN
    RAISE NOTICE '   ⚠️ WARNING: % profiles have NULL user_id', profiles_with_null_user_id;
    RAISE NOTICE '   👉 Run: emergency-link-user-ids.sql';
  ELSE
    RAISE NOTICE '   ✅ PERFECT: All users have profiles with user_id';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
