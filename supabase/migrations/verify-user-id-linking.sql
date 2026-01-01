-- =====================================================
-- VERIFICATION: Check user_id Linking Status
-- =====================================================
-- Purpose: Verify that profiles are properly linked to users
-- Created: 2025-10-18
-- Run this AFTER manual-fix-null-user-ids.sql

-- =====================================================
-- 1. OVERALL STATUS
-- =====================================================
SELECT
  '📊 OVERALL STATUS' as report_section,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as profiles_with_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as profiles_without_user_id,
  ROUND(
    (COUNT(*) FILTER (WHERE user_id IS NOT NULL)::NUMERIC /
     NULLIF(COUNT(*), 0)::NUMERIC) * 100,
    2
  ) as percentage_linked
FROM profiles;

-- =====================================================
-- 2. USERS TABLE STATUS
-- =====================================================
SELECT
  '👥 USERS TABLE STATUS' as report_section,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE role = 'user') as regular_users
FROM users;

-- =====================================================
-- 3. USER-PROFILE RELATIONSHIP CHECK
-- =====================================================
-- Check if users have profiles
SELECT
  '🔗 USER-PROFILE RELATIONSHIP' as report_section,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.user_id) as users_with_profiles,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.user_id) as users_without_profiles
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- =====================================================
-- 4. SAMPLE: Successfully Linked Profiles
-- =====================================================
SELECT
  '✅ SUCCESSFULLY LINKED (Sample)' as status,
  u.id as user_id,
  u.email as user_email,
  p.id as profile_id,
  p.user_id as profile_user_id,
  CASE WHEN u.id = p.user_id THEN '✅ Match' ELSE '❌ Mismatch' END as link_status
FROM users u
INNER JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- 5. PROFILES STILL WITH NULL user_id
-- =====================================================
SELECT
  '❌ STILL NULL (Needs Attention)' as status,
  p.id as profile_id,
  p.email,
  p.first_name,
  p.last_name,
  p.created_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM users u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    ) THEN '⚠️ User exists - check email match'
    ELSE '❌ No matching user in users table'
  END as issue
FROM profiles p
WHERE p.user_id IS NULL
ORDER BY p.created_at DESC
LIMIT 20;

-- =====================================================
-- 6. USERS WITHOUT PROFILES
-- =====================================================
SELECT
  '📝 USERS WITHOUT PROFILES' as status,
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at,
  '⚠️ Profile should be created' as action_needed
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = u.id
)
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- 7. DUPLICATE EMAIL CHECK
-- =====================================================
SELECT
  '⚠️ DUPLICATE EMAILS IN PROFILES' as status,
  email,
  COUNT(*) as profile_count,
  STRING_AGG(id::text, ', ') as profile_ids
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY profile_count DESC
LIMIT 10;

-- =====================================================
-- 8. EMAIL CASE SENSITIVITY ISSUES
-- =====================================================
SELECT
  '🔤 EMAIL CASE MISMATCHES' as status,
  p.email as profile_email,
  u.email as user_email,
  p.user_id as profile_user_id,
  u.id as user_id,
  'Emails match (case-insensitive) but linked differently' as issue
FROM profiles p
INNER JOIN users u ON LOWER(p.email) = LOWER(u.email)
WHERE p.user_id != u.id
  OR (p.user_id IS NULL AND u.id IS NOT NULL)
LIMIT 10;

-- =====================================================
-- 9. FOREIGN KEY CONSTRAINT CHECK
-- =====================================================
-- Verify that all non-NULL user_ids actually exist in users table
SELECT
  '🔍 FOREIGN KEY VALIDATION' as status,
  COUNT(*) as profiles_with_user_id,
  COUNT(*) FILTER (
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
  ) as valid_foreign_keys,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
  ) as invalid_foreign_keys
FROM profiles p
WHERE p.user_id IS NOT NULL;

-- =====================================================
-- 10. RECOMMENDED NEXT STEPS
-- =====================================================
DO $$
DECLARE
  null_count INTEGER;
  users_without_profiles INTEGER;
  orphaned_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM profiles WHERE user_id IS NULL;

  SELECT COUNT(*) INTO users_without_profiles
  FROM users u
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);

  SELECT COUNT(*) INTO orphaned_profiles
  FROM profiles p
  WHERE p.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 RECOMMENDED NEXT STEPS';
  RAISE NOTICE '========================================';

  IF null_count = 0 AND users_without_profiles = 0 THEN
    RAISE NOTICE '🎉 PERFECT! All profiles linked correctly!';
    RAISE NOTICE '✅ All users have profiles';
    RAISE NOTICE '✅ All profiles have user_id';
  ELSE
    IF null_count > 0 THEN
      RAISE NOTICE '⚠️  % profiles still have NULL user_id', null_count;

      IF orphaned_profiles > 0 THEN
        RAISE NOTICE '   └─ % are orphaned (no matching user)', orphaned_profiles;
        RAISE NOTICE '   └─ Consider deleting these orphaned profiles:';
        RAISE NOTICE '      DELETE FROM profiles WHERE user_id IS NULL;';
      END IF;
    END IF;

    IF users_without_profiles > 0 THEN
      RAISE NOTICE '📝 % users need profiles created', users_without_profiles;
      RAISE NOTICE '   Run the trigger or create manually';
    END IF;
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 11. QUICK FIX COMMANDS (if needed)
-- =====================================================
-- Uncomment and run these if you want to:

-- A) Delete orphaned profiles (profiles with no matching user)
-- DELETE FROM profiles
-- WHERE user_id IS NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM users u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(email))
--   );

-- B) Create profiles for users without profiles
-- INSERT INTO profiles (user_id, email, first_name, last_name, phone_number)
-- SELECT id, email, first_name, last_name, phone_number
-- FROM users
-- WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = users.id)
-- ON CONFLICT (email) DO NOTHING;

-- C) Re-run email matching one more time
-- UPDATE profiles p
-- SET user_id = u.id, updated_at = NOW()
-- FROM users u
-- WHERE p.user_id IS NULL
--   AND LOWER(TRIM(p.email)) = LOWER(TRIM(u.email));
