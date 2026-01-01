-- Migration: Fix existing profiles with NULL user_id
-- Description: Links existing orphaned profiles to their corresponding users
-- Created: 2025-10-18
-- WARNING: This is a ONE-TIME fix script. Run this before enabling the trigger.

-- =====================================================
-- STEP 1: Create profiles for users that don't have one
-- =====================================================

-- Insert profiles for users who don't have a profile yet
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  phone_number,
  created_at,
  updated_at
)
SELECT
  u.id AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone_number,
  NOW() AS created_at,
  NOW() AS updated_at
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.user_id = u.id
)
ON CONFLICT (email) DO NOTHING; -- Skip if email already exists in profiles

-- Log how many profiles were created
DO $$
DECLARE
  created_count INTEGER;
BEGIN
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RAISE NOTICE 'Created % new profiles for users without profiles', created_count;
END $$;

-- =====================================================
-- STEP 2: Link orphaned profiles (where user_id IS NULL)
-- =====================================================

-- Try to match profiles with NULL user_id to users by email
UPDATE public.profiles p
SET
  user_id = u.id,
  updated_at = NOW()
FROM public.users u
WHERE p.user_id IS NULL
  AND p.email = u.email;

-- Log how many profiles were linked
DO $$
DECLARE
  linked_count INTEGER;
BEGIN
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RAISE NOTICE 'Linked % orphaned profiles to users by email match', linked_count;
END $$;

-- =====================================================
-- STEP 3: Report remaining orphaned profiles
-- =====================================================

-- Show profiles that still have NULL user_id (manual intervention needed)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.profiles
  WHERE user_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Still have % profiles with NULL user_id - manual review needed', orphaned_count;
  ELSE
    RAISE NOTICE 'All profiles successfully linked to users!';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Validation Query (Run this to verify)
-- =====================================================

-- Uncomment to see the current status:
-- SELECT
--   COUNT(*) FILTER (WHERE user_id IS NOT NULL) as profiles_with_user_id,
--   COUNT(*) FILTER (WHERE user_id IS NULL) as profiles_without_user_id,
--   COUNT(*) as total_profiles
-- FROM public.profiles;

-- =====================================================
-- STEP 5: Optional - Delete orphaned profiles (BE CAREFUL!)
-- =====================================================

-- UNCOMMENT ONLY IF YOU WANT TO DELETE PROFILES WITHOUT USERS
-- This will permanently delete profiles that couldn't be matched to users

-- DELETE FROM public.profiles
-- WHERE user_id IS NULL;

-- RAISE NOTICE 'Deleted orphaned profiles with NULL user_id';
