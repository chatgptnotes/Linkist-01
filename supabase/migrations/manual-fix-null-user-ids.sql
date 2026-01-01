-- =====================================================
-- MANUAL FIX: Link NULL user_id to users
-- =====================================================
-- Purpose: Fix profiles with NULL user_id using multiple strategies
-- Created: 2025-10-18
-- Run this AFTER diagnostic-null-user-ids.sql

-- =====================================================
-- STRATEGY 1: Exact Email Match (Case-Insensitive)
-- =====================================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRATEGY 1: Exact Email Match';
  RAISE NOTICE '========================================';

  -- Update profiles where email matches (case-insensitive, trimmed)
  UPDATE profiles p
  SET
    user_id = u.id,
    updated_at = NOW()
  FROM users u
  WHERE p.user_id IS NULL
    AND LOWER(TRIM(p.email)) = LOWER(TRIM(u.email));

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fixed % profiles via exact email match', updated_count;
END $$;

-- =====================================================
-- STRATEGY 2: Create Profiles for Users Without Profiles
-- =====================================================
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRATEGY 2: Create Missing Profiles';
  RAISE NOTICE '========================================';

  -- Insert profiles for users who don't have one
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
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    NOW() as created_at,
    NOW() as updated_at
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
  )
  -- Avoid duplicate email constraint
  AND u.email NOT IN (SELECT email FROM profiles)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE '✅ Created % new profiles for users', inserted_count;
END $$;

-- =====================================================
-- STRATEGY 3: Handle Email Duplicates
-- =====================================================
-- If a profile email matches multiple users, link to the oldest user
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRATEGY 3: Handle Duplicates';
  RAISE NOTICE '========================================';

  -- For profiles with NULL user_id, if multiple users have same email,
  -- link to the oldest user (created_at ASC)
  WITH ranked_users AS (
    SELECT
      u.id as user_id,
      LOWER(TRIM(u.email)) as normalized_email,
      ROW_NUMBER() OVER (
        PARTITION BY LOWER(TRIM(u.email))
        ORDER BY u.created_at ASC
      ) as rn
    FROM users u
  )
  UPDATE profiles p
  SET
    user_id = ru.user_id,
    updated_at = NOW()
  FROM ranked_users ru
  WHERE p.user_id IS NULL
    AND LOWER(TRIM(p.email)) = ru.normalized_email
    AND ru.rn = 1; -- Only link to first/oldest user

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fixed % profiles with duplicate handling', updated_count;
END $$;

-- =====================================================
-- STRATEGY 4: Email Domain Matching (Last Resort)
-- =====================================================
-- Try to match by email if case/whitespace is very different
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRATEGY 4: Aggressive Email Match';
  RAISE NOTICE '========================================';

  -- Remove all non-alphanumeric except @ and .
  -- This handles weird whitespace, unicode, etc.
  UPDATE profiles p
  SET
    user_id = u.id,
    updated_at = NOW()
  FROM users u
  WHERE p.user_id IS NULL
    AND REGEXP_REPLACE(LOWER(p.email), '[^a-z0-9@.]', '', 'g')
      = REGEXP_REPLACE(LOWER(u.email), '[^a-z0-9@.]', '', 'g');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fixed % profiles via aggressive match', updated_count;
END $$;

-- =====================================================
-- FINAL REPORT
-- =====================================================
DO $$
DECLARE
  total_profiles INTEGER;
  with_user_id INTEGER;
  without_user_id INTEGER;
  percentage_fixed NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO with_user_id FROM profiles WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO without_user_id FROM profiles WHERE user_id IS NULL;

  IF total_profiles > 0 THEN
    percentage_fixed := ROUND((with_user_id::NUMERIC / total_profiles::NUMERIC) * 100, 2);
  ELSE
    percentage_fixed := 0;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles WITH user_id: % (%.2f%%)', with_user_id, percentage_fixed;
  RAISE NOTICE 'Profiles WITHOUT user_id: %', without_user_id;
  RAISE NOTICE '========================================';

  IF without_user_id = 0 THEN
    RAISE NOTICE '🎉 SUCCESS! All profiles have user_id';
  ELSIF without_user_id > 0 THEN
    RAISE NOTICE '⚠️  Still have % profiles with NULL user_id', without_user_id;
    RAISE NOTICE '   These profiles may be orphaned (no matching user)';
    RAISE NOTICE '   Consider manual review or deletion';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '👉 Next: Run verify-user-id-linking.sql to see details';
END $$;

-- =====================================================
-- SHOW REMAINING NULL PROFILES (if any)
-- =====================================================
SELECT
  '⚠️ STILL NULL - Manual Review Needed' as status,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.created_at,
  CASE
    WHEN EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(p.email))
    THEN '❓ User exists but not linked'
    ELSE '❌ No matching user found'
  END as reason
FROM profiles p
WHERE p.user_id IS NULL
ORDER BY p.created_at DESC
LIMIT 20;
