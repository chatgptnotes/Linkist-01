-- =====================================================
-- TEST REGISTRATION FLOW
-- =====================================================
-- Purpose: Test that trigger creates profile automatically
-- Safe to run - creates test data that can be cleaned up

-- =====================================================
-- STEP 1: Create test user
-- =====================================================
DO $$
DECLARE
  test_email TEXT := 'trigger-test-' || floor(random() * 10000) || '@test.com';
  new_user_id UUID;
  profile_count INTEGER;
  profile_user_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING TRIGGER - New User Registration';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 1: Creating test user...';
  RAISE NOTICE 'Email: %', test_email;

  -- Insert test user
  INSERT INTO public.users (
    email,
    first_name,
    last_name,
    phone_number,
    role,
    email_verified
  ) VALUES (
    test_email,
    'Trigger',
    'Test',
    '+911234567890',
    'user',
    FALSE
  )
  RETURNING id INTO new_user_id;

  RAISE NOTICE '✅ User created with ID: %', new_user_id;

  -- Wait a moment for trigger to execute
  PERFORM pg_sleep(0.5);

  -- Check if profile was created
  SELECT COUNT(*), MAX(user_id)
  INTO profile_count, profile_user_id
  FROM public.profiles
  WHERE email = test_email;

  RAISE NOTICE '';
  RAISE NOTICE 'Step 2: Checking if profile was created...';

  IF profile_count = 0 THEN
    RAISE WARNING '❌ FAIL: No profile created!';
    RAISE WARNING '   Trigger is NOT working';
    RAISE WARNING '   Run: fix-trigger-with-error-handling.sql';
  ELSIF profile_count > 1 THEN
    RAISE WARNING '⚠️  WARNING: Multiple profiles created (%)', profile_count;
  ELSIF profile_user_id IS NULL THEN
    RAISE WARNING '❌ FAIL: Profile created but user_id is NULL!';
    RAISE WARNING '   Trigger is broken';
  ELSIF profile_user_id != new_user_id THEN
    RAISE WARNING '❌ FAIL: Profile linked to wrong user!';
    RAISE WARNING '   Expected: %, Got: %', new_user_id, profile_user_id;
  ELSE
    RAISE NOTICE '✅ SUCCESS: Profile created with correct user_id';
    RAISE NOTICE '   Profile count: %', profile_count;
    RAISE NOTICE '   user_id matches: % = %', new_user_id, profile_user_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 2: Show test results
-- =====================================================
SELECT
  '📊 TEST USER AND PROFILE' as section,
  u.id as user_id,
  u.email as user_email,
  u.first_name,
  p.id as profile_id,
  p.user_id as profile_user_id,
  CASE
    WHEN p.id IS NULL THEN '❌ NO PROFILE CREATED'
    WHEN p.user_id IS NULL THEN '❌ PROFILE HAS NULL user_id'
    WHEN p.user_id = u.id THEN '✅ CORRECTLY LINKED'
    ELSE '❌ WRONG USER LINK'
  END as status
FROM users u
LEFT JOIN profiles p ON u.email = p.email
WHERE u.email LIKE 'trigger-test-%@test.com'
ORDER BY u.created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 3: Cleanup (optional - uncomment to delete test data)
-- =====================================================
-- UNCOMMENT THESE LINES TO DELETE TEST DATA:

-- DELETE FROM profiles
-- WHERE email LIKE 'trigger-test-%@test.com';

-- DELETE FROM users
-- WHERE email LIKE 'trigger-test-%@test.com';

-- SELECT 'Test data cleaned up' as status;

-- =====================================================
-- STEP 4: Check overall database status
-- =====================================================
DO $$
DECLARE
  total_users INTEGER;
  total_profiles INTEGER;
  users_with_profiles INTEGER;
  profiles_with_user_id INTEGER;
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO total_profiles FROM profiles;

  SELECT COUNT(DISTINCT u.id) INTO users_with_profiles
  FROM users u
  INNER JOIN profiles p ON u.id = p.user_id;

  SELECT COUNT(*) INTO profiles_with_user_id
  FROM profiles WHERE user_id IS NOT NULL;

  SELECT COUNT(*) INTO mismatch_count
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  WHERE p.id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OVERALL DATABASE STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Users with profiles: %', users_with_profiles;
  RAISE NOTICE 'Profiles with user_id: %', profiles_with_user_id;
  RAISE NOTICE 'Users without profiles: %', mismatch_count;

  IF mismatch_count = 0 AND profiles_with_user_id = total_profiles THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PERFECT! Database is consistent';
    RAISE NOTICE '✅ All users have profiles';
    RAISE NOTICE '✅ All profiles have user_id';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Database needs cleanup:';
    IF mismatch_count > 0 THEN
      RAISE NOTICE '   - % users need profiles', mismatch_count;
    END IF;
    IF profiles_with_user_id < total_profiles THEN
      RAISE NOTICE '   - % profiles have NULL user_id', (total_profiles - profiles_with_user_id);
      RAISE NOTICE '   👉 Run: emergency-link-user-ids.sql';
    END IF;
  END IF;

  RAISE NOTICE '========================================';
END $$;
