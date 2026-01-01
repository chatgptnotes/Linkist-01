-- Migration: Add profile_url column to profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/editor

-- Step 1: Add the column if it doesn't exist
DO $$
BEGIN
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

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_url
ON public.profiles(profile_url);

-- Step 3: Update existing records with full URLs (for local development)
UPDATE public.profiles
SET profile_url = 'http://localhost:3000/' || custom_url
WHERE custom_url IS NOT NULL
AND (profile_url IS NULL OR profile_url = '');

-- Step 4: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('custom_url', 'profile_url')
ORDER BY column_name;

-- Step 5: Show sample data
SELECT
    id,
    email,
    custom_url,
    profile_url,
    created_at
FROM public.profiles
WHERE custom_url IS NOT NULL
LIMIT 5;
