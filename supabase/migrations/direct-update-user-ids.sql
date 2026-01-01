-- =====================================================
-- DIRECT UPDATE: Link user_ids NOW
-- =====================================================
-- This is a SIMPLE, DIRECT update - no complex blocks
-- Just pure SQL that ACTUALLY modifies the database

-- =====================================================
-- STEP 1: Direct UPDATE (THE ACTUAL FIX)
-- =====================================================

-- Update profiles.user_id where it's NULL
-- Match by email with users table
UPDATE profiles
SET
    user_id = users.id,
    updated_at = NOW()
FROM users
WHERE profiles.email = users.email
  AND profiles.user_id IS NULL;

-- This will show: "UPDATE X" where X is number of rows updated

-- =====================================================
-- STEP 2: Verify the update worked
-- =====================================================

-- Show how many are NOW linked
SELECT
    'AFTER UPDATE' as status,
    COUNT(*) as total_profiles,
    COUNT(user_id) as profiles_with_user_id,
    COUNT(*) - COUNT(user_id) as profiles_still_null
FROM profiles;

-- =====================================================
-- STEP 3: Show sample of updated profiles
-- =====================================================

-- Show examples of successfully linked profiles
SELECT
    'SUCCESSFULLY LINKED' as status,
    email,
    user_id,
    updated_at
FROM profiles
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- =====================================================
-- STEP 4: Show any remaining NULL profiles
-- =====================================================

-- If any profiles still have NULL, show them
SELECT
    'STILL NULL (No matching user)' as status,
    id as profile_id,
    email,
    first_name,
    last_name
FROM profiles
WHERE user_id IS NULL
LIMIT 10;
