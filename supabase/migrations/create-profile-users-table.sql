-- =====================================================
-- CREATE: profile_users Junction Table
-- =====================================================
-- Purpose: Link profiles to users via separate mapping table
-- This solves the user_id NULL issue in profiles table

-- =====================================================
-- STEP 1: Create profile_users Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_profile
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE,

  -- Unique constraint: one profile = one user
  CONSTRAINT unique_profile_user
    UNIQUE (profile_id, user_id)
);

-- =====================================================
-- STEP 2: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profile_users_profile_id
  ON public.profile_users(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_users_user_id
  ON public.profile_users(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_users_created_at
  ON public.profile_users(created_at);

-- =====================================================
-- STEP 3: Add Comments
-- =====================================================

COMMENT ON TABLE public.profile_users IS
'Junction table linking profiles to users. Solves the user_id NULL issue in profiles table.';

COMMENT ON COLUMN public.profile_users.profile_id IS
'Reference to profiles table';

COMMENT ON COLUMN public.profile_users.user_id IS
'Reference to users table';

-- =====================================================
-- STEP 4: Populate with Existing Data
-- =====================================================
-- Link profiles that already have user_id set

INSERT INTO public.profile_users (profile_id, user_id, created_at, updated_at)
SELECT
  p.id as profile_id,
  p.user_id as user_id,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.user_id IS NOT NULL
ON CONFLICT (profile_id, user_id) DO NOTHING;

-- =====================================================
-- STEP 5: Link Remaining Profiles by Email Matching
-- =====================================================
-- For profiles with NULL user_id, try to link by email

INSERT INTO public.profile_users (profile_id, user_id, created_at, updated_at)
SELECT
  p.id as profile_id,
  u.id as user_id,
  NOW() as created_at,
  NOW() as updated_at
FROM public.profiles p
INNER JOIN public.users u
  ON LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
WHERE p.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_users pu
    WHERE pu.profile_id = p.id
  )
ON CONFLICT (profile_id, user_id) DO NOTHING;

-- =====================================================
-- STEP 6: Create Helper Function - Get User from Profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_from_profile(p_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profile_users
  WHERE profile_id = p_profile_id
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_from_profile IS
'Get user_id for a given profile_id from profile_users junction table';

-- =====================================================
-- STEP 7: Create Helper Function - Get Profile from User
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_profile_from_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT profile_id INTO v_profile_id
  FROM public.profile_users
  WHERE user_id = p_user_id
  LIMIT 1;

  RETURN v_profile_id;
END;
$$;

COMMENT ON FUNCTION public.get_profile_from_user IS
'Get profile_id for a given user_id from profile_users junction table';

-- =====================================================
-- STEP 8: Create Trigger to Auto-Link on Profile Insert
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_link_profile_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find user by email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
  LIMIT 1;

  -- If user found, create link in profile_users
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profile_users (profile_id, user_id)
    VALUES (NEW.id, v_user_id)
    ON CONFLICT (profile_id, user_id) DO NOTHING;

    RAISE NOTICE '[profile_users] Linked profile % to user %', NEW.id, v_user_id;
  ELSE
    RAISE NOTICE '[profile_users] No user found for email %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_link_profile ON public.profiles;

CREATE TRIGGER trigger_auto_link_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_profile_to_user();

COMMENT ON TRIGGER trigger_auto_link_profile ON public.profiles IS
'Automatically links new profiles to users via profile_users junction table';

-- =====================================================
-- STEP 9: Create Trigger to Auto-Link on User Insert
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_link_user_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Try to find profile by email
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
  LIMIT 1;

  -- If profile found, create link in profile_users
  IF v_profile_id IS NOT NULL THEN
    INSERT INTO public.profile_users (profile_id, user_id)
    VALUES (v_profile_id, NEW.id)
    ON CONFLICT (profile_id, user_id) DO NOTHING;

    RAISE NOTICE '[profile_users] Linked user % to profile %', NEW.id, v_profile_id;
  ELSE
    RAISE NOTICE '[profile_users] No profile found for email %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_link_user ON public.users;

CREATE TRIGGER trigger_auto_link_user
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_user_to_profile();

COMMENT ON TRIGGER trigger_auto_link_user ON public.users IS
'Automatically links new users to profiles via profile_users junction table';

-- =====================================================
-- STEP 10: Verification
-- =====================================================

DO $$
DECLARE
  total_profile_users INTEGER;
  total_profiles INTEGER;
  total_users INTEGER;
  linked_profiles INTEGER;
  unlinked_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profile_users FROM public.profile_users;
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO total_users FROM public.users;

  SELECT COUNT(DISTINCT profile_id) INTO linked_profiles
  FROM public.profile_users;

  unlinked_profiles := total_profiles - linked_profiles;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profile_users TABLE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total links in profile_users: %', total_profile_users;
  RAISE NOTICE 'Profiles linked: %', linked_profiles;
  RAISE NOTICE 'Profiles unlinked: %', unlinked_profiles;
  RAISE NOTICE '========================================';

  IF unlinked_profiles = 0 THEN
    RAISE NOTICE '🎉 SUCCESS! All profiles are linked to users';
  ELSIF unlinked_profiles > 0 THEN
    RAISE NOTICE '⚠️  % profiles not linked (no matching user email)', unlinked_profiles;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions created:';
  RAISE NOTICE '  - get_user_from_profile(profile_id)';
  RAISE NOTICE '  - get_profile_from_user(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  - trigger_auto_link_profile (on profiles INSERT)';
  RAISE NOTICE '  - trigger_auto_link_user (on users INSERT)';
  RAISE NOTICE '========================================';
END $$;

-- Show sample links
SELECT
  'SAMPLE LINKS' as status,
  pu.id,
  u.email as user_email,
  p.email as profile_email,
  pu.created_at
FROM public.profile_users pu
INNER JOIN public.users u ON pu.user_id = u.id
INNER JOIN public.profiles p ON pu.profile_id = p.id
ORDER BY pu.created_at DESC
LIMIT 10;
