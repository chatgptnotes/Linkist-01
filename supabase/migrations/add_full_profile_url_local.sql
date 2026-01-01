-- Add full profile URL column to profiles table (LOCAL VERSION)
-- This will store the complete URL like http://localhost:3001/bhupendra

DO $$
BEGIN
    -- Add profile_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'profile_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_url TEXT;

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_profile_url ON public.profiles(profile_url);

        -- Add comment
        COMMENT ON COLUMN public.profiles.profile_url IS 'Complete profile URL (e.g., http://localhost:3001/bhupendra)';
    END IF;

    -- Update existing profiles with LOCAL URL
    UPDATE public.profiles
    SET profile_url = 'http://localhost:3001/' || custom_url
    WHERE custom_url IS NOT NULL
    AND (profile_url IS NULL OR profile_url = '');

END $$;
