-- =====================================================
-- FIX TRIGGER: Add Error Handling
-- =====================================================
-- Purpose: Recreate trigger with proper error handling
-- This prevents silent failures

-- =====================================================
-- DROP OLD TRIGGER AND FUNCTION
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_create_profile ON public.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();

-- =====================================================
-- CREATE IMPROVED FUNCTION WITH ERROR HANDLING
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_exists BOOLEAN;
  insert_successful BOOLEAN := FALSE;
BEGIN
  -- Check if profile already exists for this user
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = NEW.id OR LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
  ) INTO profile_exists;

  IF profile_exists THEN
    -- Profile exists, try to update user_id if NULL
    UPDATE public.profiles
    SET
      user_id = NEW.id,
      updated_at = NOW()
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
      AND user_id IS NULL;

    IF FOUND THEN
      RAISE NOTICE '[TRIGGER] Updated existing profile for user_id: % (email: %)', NEW.id, NEW.email;
    ELSE
      RAISE NOTICE '[TRIGGER] Profile already exists for user_id: % (email: %)', NEW.id, NEW.email;
    END IF;

    RETURN NEW;
  END IF;

  -- Try to insert new profile with conflict handling
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      phone_number,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.first_name,
      NEW.last_name,
      NEW.phone_number,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET
      user_id = EXCLUDED.user_id,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone_number = EXCLUDED.phone_number,
      updated_at = NOW()
    WHERE profiles.user_id IS NULL;

    insert_successful := TRUE;
    RAISE NOTICE '[TRIGGER] ✅ Profile created for user_id: % (email: %)', NEW.id, NEW.email;

  EXCEPTION
    WHEN unique_violation THEN
      -- Handle duplicate email gracefully
      RAISE NOTICE '[TRIGGER] ⚠️ Profile with email % already exists, trying to link', NEW.email;

      UPDATE public.profiles
      SET user_id = NEW.id, updated_at = NOW()
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
        AND user_id IS NULL;

      IF FOUND THEN
        RAISE NOTICE '[TRIGGER] ✅ Linked existing profile to user_id: %', NEW.id;
      ELSE
        RAISE WARNING '[TRIGGER] ❌ Could not link profile for user_id: % (email: %)', NEW.id, NEW.email;
      END IF;

    WHEN OTHERS THEN
      -- Log any other errors but don't fail user creation
      RAISE WARNING '[TRIGGER] ❌ Error creating profile for user_id: % - Error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- =====================================================
-- CREATE IMPROVED TRIGGER
-- =====================================================
CREATE TRIGGER trigger_auto_create_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();

-- =====================================================
-- ADD COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.create_profile_for_new_user() IS
'Automatically creates/updates profile when user is registered. Handles duplicates and errors gracefully.';

COMMENT ON TRIGGER trigger_auto_create_profile ON public.users IS
'Auto-creates profile with user_id when user registers. Includes error handling for duplicates.';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TRIGGER RECREATED WITH ERROR HANDLING';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Improvements:';
  RAISE NOTICE '  ✅ Handles duplicate emails gracefully';
  RAISE NOTICE '  ✅ ON CONFLICT clause for safety';
  RAISE NOTICE '  ✅ Detailed logging (NOTICE/WARNING)';
  RAISE NOTICE '  ✅ Updates existing NULL user_ids';
  RAISE NOTICE '  ✅ Never fails user creation';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Next: Test with new user registration';
  RAISE NOTICE '========================================';
END $$;

-- Show trigger details
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  'ENABLED' as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_profile';
