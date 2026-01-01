-- =====================================================
-- VERIFY user_id COLUMN
-- =====================================================
-- Purpose: Simple query to check user_id status clearly
-- Shows exactly what's in the user_id column

-- =====================================================
-- 1. CHECK IF user_id COLUMN EXISTS
-- =====================================================
SELECT
  '1️⃣ COLUMN EXISTS CHECK' as check_name,
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name = 'user_id' THEN '✅ user_id column EXISTS'
    ELSE column_name
  END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('id', 'email', 'user_id', 'first_name', 'last_name')
ORDER BY ordinal_position;

-- =====================================================
-- 2. COUNT NULL vs NOT NULL
-- =====================================================
SELECT
  '2️⃣ user_id STATUS' as check_name,
  COUNT(*) as total_profiles,
  COUNT(user_id) as profiles_with_user_id,
  COUNT(*) - COUNT(user_id) as profiles_with_null_user_id,
  ROUND((COUNT(user_id)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2) as percentage_filled
FROM profiles;

-- =====================================================
-- 3. SHOW SAMPLE DATA - ONLY RELEVANT COLUMNS
-- =====================================================
-- This clearly shows user_id column with data
SELECT
  '3️⃣ SAMPLE DATA (First 10 rows)' as check_name,
  SUBSTRING(email, 1, 30) as email_short,
  user_id,
  CASE
    WHEN user_id IS NULL THEN '❌ NULL'
    ELSE '✅ HAS VALUE'
  END as status,
  created_at::DATE as created_date
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 4. DETAILED BREAKDOWN
-- =====================================================
SELECT
  '4️⃣ DETAILED BREAKDOWN' as check_name,
  CASE
    WHEN user_id IS NULL THEN '❌ user_id is NULL'
    ELSE '✅ user_id is SET'
  END as user_id_status,
  COUNT(*) as count
FROM profiles
GROUP BY
  CASE
    WHEN user_id IS NULL THEN '❌ user_id is NULL'
    ELSE '✅ user_id is SET'
  END
ORDER BY user_id_status;

-- =====================================================
-- 5. CHECK IF user_id MATCHES ACTUAL USERS
-- =====================================================
SELECT
  '5️⃣ FOREIGN KEY VALIDATION' as check_name,
  COUNT(DISTINCT p.user_id) as unique_user_ids_in_profiles,
  COUNT(DISTINCT u.id) as total_users_in_users_table,
  COUNT(DISTINCT p.user_id) FILTER (
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
  ) as valid_foreign_keys,
  COUNT(DISTINCT p.user_id) FILTER (
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
  ) as invalid_foreign_keys
FROM profiles p
FULL OUTER JOIN users u ON TRUE
WHERE p.user_id IS NOT NULL;

-- =====================================================
-- 6. SHOW SPECIFIC EXAMPLES
-- =====================================================
-- Show profiles WITH user_id
SELECT
  '6️⃣ EXAMPLES: Profiles WITH user_id' as example_type,
  id as profile_id,
  email,
  user_id,
  '✅' as status
FROM profiles
WHERE user_id IS NOT NULL
LIMIT 5;

-- Show profiles WITHOUT user_id (NULL)
SELECT
  '6️⃣ EXAMPLES: Profiles WITHOUT user_id (NULL)' as example_type,
  id as profile_id,
  email,
  user_id,
  '❌ NULL' as status
FROM profiles
WHERE user_id IS NULL
LIMIT 5;

-- =====================================================
-- 7. FINAL SUMMARY WITH RECOMMENDATIONS
-- =====================================================
DO $$
DECLARE
  total_count INTEGER;
  null_count INTEGER;
  filled_count INTEGER;
  percentage NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE user_id IS NULL),
    COUNT(*) FILTER (WHERE user_id IS NOT NULL)
  INTO total_count, null_count, filled_count
  FROM profiles;

  IF total_count > 0 THEN
    percentage := ROUND((filled_count::NUMERIC / total_count::NUMERIC) * 100, 2);
  ELSE
    percentage := 0;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 FINAL SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_count;
  RAISE NOTICE 'Profiles WITH user_id: % (%.2f%%)', filled_count, percentage;
  RAISE NOTICE 'Profiles WITHOUT user_id (NULL): %', null_count;
  RAISE NOTICE '========================================';

  IF null_count = 0 THEN
    RAISE NOTICE '🎉 PERFECT! All profiles have user_id';
  ELSIF null_count = total_count THEN
    RAISE NOTICE '❌ CRITICAL: ALL profiles have NULL user_id!';
    RAISE NOTICE '';
    RAISE NOTICE '👉 IMMEDIATE ACTION NEEDED:';
    RAISE NOTICE '   Run: emergency-link-user-ids.sql';
  ELSIF null_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % profiles have NULL user_id', null_count;
    RAISE NOTICE '';
    RAISE NOTICE '👉 RECOMMENDED ACTION:';
    RAISE NOTICE '   Run: emergency-link-user-ids.sql';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Scroll RIGHT in table view to see user_id column →→→';
  RAISE NOTICE '========================================';
END $$;
