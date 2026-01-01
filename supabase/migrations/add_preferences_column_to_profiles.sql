-- Add preferences column to profiles table for storing visibility toggles
-- This migration is idempotent and can be run multiple times safely

DO $$
BEGIN
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}';
        COMMENT ON COLUMN public.profiles.preferences IS 'User preferences for visibility toggles and other settings';

        RAISE NOTICE 'Added preferences column to profiles table';
    ELSE
        RAISE NOTICE 'preferences column already exists in profiles table';
    END IF;
END $$;

-- Create an index on preferences for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN (preferences);

-- Add comment explaining the preferences structure
COMMENT ON COLUMN public.profiles.preferences IS 'JSONB column storing user preferences including:
- showEmailPublicly: boolean (default: true)
- showMobilePublicly: boolean (default: true)
- showWhatsappPublicly: boolean (default: false)
- showJobTitle: boolean (default: true)
- showCompanyName: boolean (default: true)
- showCompanyWebsite: boolean (default: true)
- showCompanyAddress: boolean (default: true)
- showIndustry: boolean (default: true)
- showSkills: boolean (default: true)
- showLinkedin: boolean (default: false)
- showInstagram: boolean (default: false)
- showFacebook: boolean (default: false)
- showTwitter: boolean (default: false)
- showBehance: boolean (default: false)
- showDribbble: boolean (default: false)
- showGithub: boolean (default: false)
- showYoutube: boolean (default: false)
- showProfilePhoto: boolean (default: true)
- showBackgroundImage: boolean (default: true)';
