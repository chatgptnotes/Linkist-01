-- =====================================================
-- DEBUG: Why UPDATE is NOT Working
-- =====================================================
-- Find exact reason why user_id is not being updated

-- =====================================================
-- 1. CHECK EXACT EMAIL MATCHING
-- =====================================================
SELECT
  'EMAIL MATCHING TEST' as test_name,
  p.email as profile_email,
  u.email as user_email,
  p.email = u.email as exact_match,
  LOWER(p.email) = LOWER(u.email) as case_insensitive_match,
  LENGTH(p.email) as profile_email_length,
  LENGTH(u.email) as user_email_length,
  p.user_id as current_user_id,
  u.id as should_be_user_id
FROM profiles p
INNER JOIN users u ON LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
WHERE p.user_id IS NULL
LIMIT 10;

-- =====================================================
-- 2. CHECK IF ANY PROFILES CAN BE MATCHED
-- =====================================================
SELECT
  'PROFILES WITH MATCHING USERS' as test_name,
  COUNT(*) as profiles_that_can_be_linked
FROM profiles p
WHERE p.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
  );

-- =====================================================
-- 3. CHECK ROW LEVEL SECURITY (RLS)
-- =====================================================
SELECT
  'RLS POLICIES ON PROFILES' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- =====================================================
-- 4. CHECK CURRENT USER PERMISSIONS
-- =====================================================
SELECT
  'CURRENT USER' as test_name,
  current_user as user_name,
  current_database() as database_name,
  current_schema() as schema_name;

-- =====================================================
-- 5. TEST SINGLE ROW UPDATE
-- =====================================================
-- Try updating just ONE row to see exact error
DO $$
DECLARE
  test_email TEXT;
  test_user_id UUID;
  rows_updated INTEGER;
BEGIN
  -- Get one profile with NULL user_id that has a matching user
  SELECT p.email, u.id
  INTO test_email, test_user_id
  FROM profiles p
  INNER JOIN users u ON LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
  WHERE p.user_id IS NULL
  LIMIT 1;

  IF test_email IS NOT NULL THEN
    RAISE NOTICE 'Testing update for email: %', test_email;
    RAISE NOTICE 'Will set user_id to: %', test_user_id;

    -- Try the update
    UPDATE profiles
    SET user_id = test_user_id
    WHERE email = test_email
      AND user_id IS NULL;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RAISE NOTICE 'Rows updated: %', rows_updated;

    IF rows_updated = 0 THEN
      RAISE WARNING 'UPDATE FAILED! No rows were updated';
      RAISE WARNING 'Possible reasons:';
      RAISE WARNING '  1. RLS policy blocking update';
      RAISE WARNING '  2. Insufficient permissions';
      RAISE WARNING '  3. Trigger preventing update';
    ELSE
      RAISE NOTICE 'SUCCESS! Update worked for test row';
    END IF;
  ELSE
    RAISE NOTICE 'No profiles found with matching users';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR during update: %', SQLERRM;
    RAISE WARNING 'Error code: %', SQLSTATE;
END $$;

-- =====================================================
-- 6. CHECK FOR TRIGGERS ON PROFILES
-- =====================================================
SELECT
  'TRIGGERS ON PROFILES' as test_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
  AND event_object_schema = 'public';

-- =====================================================
-- 7. VERIFY AFTER TEST UPDATE
-- =====================================================
SELECT
  'AFTER TEST UPDATE' as test_name,
  COUNT(*) as total_profiles,
  COUNT(user_id) as profiles_with_user_id,
  COUNT(*) - COUNT(user_id) as profiles_still_null
FROM profiles;

-- =====================================================
-- 8. CHECK SCHEMA LOCATION
-- =====================================================
SELECT
  'TABLE LOCATION' as test_name,
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN ('profiles', 'users')
  AND table_schema = 'public';
