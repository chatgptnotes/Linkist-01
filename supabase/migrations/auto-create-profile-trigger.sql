-- Migration: Auto-create profile when user is created
-- Description: This trigger automatically creates a profile entry when a new user is registered
-- Created: 2025-10-18

-- =====================================================
-- FUNCTION: Create profile for new user
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile record with user_id linked to the new user
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    phone_number,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,                    -- Link to users.id
    NEW.email,                 -- Copy email from users table
    NEW.first_name,            -- Copy first_name
    NEW.last_name,             -- Copy last_name
    NEW.phone_number,          -- Copy phone_number
    NOW(),                     -- Set created_at
    NOW()                      -- Set updated_at
  );

  -- Log the profile creation
  RAISE NOTICE 'Profile created for user_id: %', NEW.id;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-create profile after user insert
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_create_profile ON public.users;

CREATE TRIGGER trigger_auto_create_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();

-- =====================================================
-- COMMENT: Document the trigger
-- =====================================================
COMMENT ON FUNCTION public.create_profile_for_new_user() IS
'Automatically creates a profile entry when a new user is registered. This ensures user_id is always populated in profiles table.';

COMMENT ON TRIGGER trigger_auto_create_profile ON public.users IS
'Auto-creates profile with user_id foreign key when user registers';
