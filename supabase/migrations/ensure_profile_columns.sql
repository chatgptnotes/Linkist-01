-- Ensure profiles table has all necessary columns for public profile pages
-- This migration is idempotent and can be run multiple times safely

DO $$
BEGIN
    -- Add custom_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'custom_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN custom_url TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_profiles_custom_url ON public.profiles(custom_url);
        COMMENT ON COLUMN public.profiles.custom_url IS 'Unique URL slug for user profile (e.g., linkist.com/username)';
    END IF;

    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
    END IF;

    -- Add title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN title TEXT;
    END IF;

    -- Add bio column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'website'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
    END IF;

    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_image TEXT;
    END IF;

    -- Add cover_image column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN cover_image TEXT;
    END IF;

    -- Add photo_url column if it doesn't exist (for backwards compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN photo_url TEXT;
    END IF;

    -- Social media columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'linkedin_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'linkedin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'twitter_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'twitter'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN twitter TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'instagram_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN instagram_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'instagram'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'facebook_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN facebook_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'facebook'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN facebook TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'youtube_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN youtube_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'youtube'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN youtube TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'github_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN github_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'github'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN github TEXT;
    END IF;

    -- Add user_id column if it doesn't exist (for auth reference)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID;
    END IF;

    -- Create policy to allow public viewing of profiles by custom_url
    DROP POLICY IF EXISTS "Allow public to view profiles by custom_url" ON public.profiles;
    CREATE POLICY "Allow public to view profiles by custom_url"
        ON public.profiles
        FOR SELECT
        USING (custom_url IS NOT NULL);

END $$;

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles with custom URLs for public viewing';
COMMENT ON COLUMN public.profiles.custom_url IS 'Unique URL slug (e.g., linkist.com/username)';
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/about section';
COMMENT ON COLUMN public.profiles.profile_image IS 'URL to profile picture';
COMMENT ON COLUMN public.profiles.cover_image IS 'URL to cover/header image';
