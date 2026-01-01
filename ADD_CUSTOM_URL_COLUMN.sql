-- Migration: Add custom_url column to profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor

-- Step 1: Check if custom_url column exists
DO $$
BEGIN
    -- Add custom_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'custom_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN custom_url TEXT;

        RAISE NOTICE 'Column custom_url added successfully';
    ELSE
        RAISE NOTICE 'Column custom_url already exists';
    END IF;

    -- Add profile_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'profile_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN profile_url TEXT;

        RAISE NOTICE 'Column profile_url added successfully';
    ELSE
        RAISE NOTICE 'Column profile_url already exists';
    END IF;
END $$;

-- Step 2: Add UNIQUE constraint on custom_url (to prevent duplicates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_custom_url_key'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_custom_url_key UNIQUE (custom_url);

        RAISE NOTICE 'Unique constraint on custom_url added';
    ELSE
        RAISE NOTICE 'Unique constraint on custom_url already exists';
    END IF;
END $$;

-- Step 3: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_custom_url
ON public.profiles(custom_url);

CREATE INDEX IF NOT EXISTS idx_profiles_profile_url
ON public.profiles(profile_url);

-- Step 4: Add RLS (Row Level Security) policy to allow public viewing
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Allow public to view profiles by custom_url" ON public.profiles;

    -- Create policy to allow public viewing of profiles with custom_url
    CREATE POLICY "Allow public to view profiles by custom_url"
        ON public.profiles FOR SELECT
        USING (custom_url IS NOT NULL);

    RAISE NOTICE 'RLS policy created for public profile viewing';
END $$;

-- Step 5: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('custom_url', 'profile_url')
ORDER BY column_name;

-- Step 6: Show current table structure (all columns)
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
