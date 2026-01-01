-- Add Missing Columns to users Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor

-- Step 1: Add country column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'country'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN country TEXT NULL;

        RAISE NOTICE 'Column country added successfully';
    ELSE
        RAISE NOTICE 'Column country already exists';
    END IF;
END $$;

-- Step 2: Add country_code column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'country_code'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN country_code TEXT NULL;

        RAISE NOTICE 'Column country_code added successfully';
    ELSE
        RAISE NOTICE 'Column country_code already exists';
    END IF;
END $$;

-- Step 3: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_country
ON public.users(country);

CREATE INDEX IF NOT EXISTS idx_users_country_code
ON public.users(country_code);

-- Step 4: Reload schema cache (IMPORTANT!)
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('country', 'country_code', 'phone_number')
ORDER BY column_name;

-- Step 6: Show complete users table structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
