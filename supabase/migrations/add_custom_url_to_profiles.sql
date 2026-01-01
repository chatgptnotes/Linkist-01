-- Add custom_url column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'custom_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN custom_url TEXT UNIQUE;

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_custom_url ON profiles(custom_url);

        -- Add comment
        COMMENT ON COLUMN profiles.custom_url IS 'Unique URL slug for user profile (e.g., linkist.com/username)';
    END IF;
END $$;
