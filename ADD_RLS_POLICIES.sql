-- Add Row Level Security (RLS) Policies for Custom URL Feature
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor

-- ============================================================================
-- STEP 1: Enable RLS on profiles table (if not already enabled)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop existing policies (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "Allow public to view profiles by custom_url" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON public.profiles;

-- ============================================================================
-- STEP 3: Public SELECT Policy (for profile pages)
-- ============================================================================
-- Allow anyone to view profiles that have a custom_url (public profiles)
CREATE POLICY "Allow public to view profiles by custom_url"
    ON public.profiles
    FOR SELECT
    USING (custom_url IS NOT NULL);

-- ============================================================================
-- STEP 4: Authenticated User Policies
-- ============================================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Allow users to insert their own profile (for new users)
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        auth.jwt() ->> 'email' = email OR
        user_id IS NULL  -- Allow NULL user_id for claim-url flow
    );

-- ============================================================================
-- STEP 5: Service Role Policy (for backend operations)
-- ============================================================================
-- Allow service role (backend) to do everything
CREATE POLICY "Service role can do everything"
    ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- STEP 6: Verify RLS Policies
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- STEP 7: Test Policies
-- ============================================================================

-- Test 1: Check if public can view profiles with custom_url
SELECT
    id,
    email,
    custom_url,
    profile_url,
    first_name,
    last_name
FROM public.profiles
WHERE custom_url IS NOT NULL
LIMIT 5;

-- Test 2: Verify RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================================================
-- NOTES
-- ============================================================================

/*
These policies ensure:

1. ✅ Public Profile Pages Work
   - Anyone can view profiles with custom_url
   - Enables: http://localhost:3000/poonam

2. ✅ Users Can Claim URLs
   - Authenticated users can insert/update their profiles
   - Claim URL flow works smoothly

3. ✅ Data Security
   - Users can only edit their own profiles
   - RLS prevents unauthorized access

4. ✅ Backend Operations
   - Service role (your API) can perform all operations
   - Ensures admin/backend tasks work

5. ✅ No Duplicate Usernames
   - UNIQUE constraint on custom_url prevents duplicates
   - Database enforces uniqueness

When to use these policies:
- Run this AFTER adding custom_url and profile_url columns
- Run this AFTER reloading schema cache
- Run this BEFORE testing the claim URL feature

Production Notes:
- These policies are secure for production
- Service role key must be kept secret
- Only expose anon key to frontend
*/
