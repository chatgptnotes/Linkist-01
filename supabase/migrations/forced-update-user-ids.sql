-- =====================================================
-- FORCED UPDATE: Bypass All Issues
-- =====================================================
-- This query uses EVERY possible workaround

-- =====================================================
-- DISABLE RLS TEMPORARILY (if you have permission)
-- =====================================================
-- Uncomment if needed:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- METHOD 1: Direct UPDATE with explicit schema
-- =====================================================
UPDATE public.profiles
SET
  user_id = public.users.id,
  updated_at = CURRENT_TIMESTAMP
FROM public.users
WHERE LOWER(TRIM(public.profiles.email)) = LOWER(TRIM(public.users.email))
  AND public.profiles.user_id IS NULL;

-- Show result
SELECT 'METHOD 1 RESULT' as method, ROW_COUNT() as rows_updated;

-- =====================================================
-- METHOD 2: Update with subquery
-- =====================================================
UPDATE public.profiles p
SET
  user_id = (
    SELECT u.id
    FROM public.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    LIMIT 1
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE p.user_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
  );

-- =====================================================
-- METHOD 3: One-by-one update (guaranteed to work)
-- =====================================================
DO $$
DECLARE
  profile_record RECORD;
  matching_user_id UUID;
  total_updated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting one-by-one update...';

  FOR profile_record IN
    SELECT id, email
    FROM public.profiles
    WHERE user_id IS NULL
    LIMIT 100  -- Process first 100
  LOOP
    -- Find matching user
    SELECT u.id INTO matching_user_id
    FROM public.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(profile_record.email))
    LIMIT 1;

    IF matching_user_id IS NOT NULL THEN
      -- Update this profile
      UPDATE public.profiles
      SET
        user_id = matching_user_id,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = profile_record.id;

      total_updated := total_updated + 1;

      IF total_updated % 10 = 0 THEN
        RAISE NOTICE 'Updated % profiles so far...', total_updated;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'FINISHED! Total profiles updated: %', total_updated;
END $$;

-- =====================================================
-- RE-ENABLE RLS (if disabled above)
-- =====================================================
-- Uncomment if you disabled it:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
SELECT
  'FINAL STATUS' as status,
  COUNT(*) as total_profiles,
  COUNT(user_id) as profiles_with_user_id,
  COUNT(*) - COUNT(user_id) as profiles_still_null,
  ROUND((COUNT(user_id)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as percentage_filled
FROM public.profiles;

-- Show sample of updated profiles
SELECT
  'SAMPLE UPDATED PROFILES' as status,
  email,
  user_id,
  updated_at
FROM public.profiles
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Show any remaining NULL
SELECT
  'STILL NULL' as status,
  COUNT(*) as count
FROM public.profiles
WHERE user_id IS NULL;
