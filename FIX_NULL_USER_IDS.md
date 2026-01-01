# Fix NULL user_id in Profiles Table

## 🎯 Purpose
This migration fixes existing profiles that have `user_id = NULL` by matching them with corresponding users in the `users` table based on email addresses.

## 📊 What This Does

1. **Shows current state** - Displays how many profiles have NULL user_ids
2. **Updates NULL records** - Matches profiles to users by email and populates user_id
3. **Verifies the fix** - Shows final counts of fixed vs remaining NULL records
4. **Lists orphans** - Shows any profiles that don't have matching users

## 🚀 How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the entire content of `supabase/migrations/008_fix_null_user_ids.sql`
4. Paste and click **RUN**
5. Check the output messages for results

### Option 2: Command Line

```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/008_fix_null_user_ids.sql
```

### Option 3: Quick Fix Query (Manual)

If you just want to fix it quickly without running the full migration:

```sql
-- Quick fix: Update NULL user_ids
UPDATE profiles p
SET user_id = u.id
FROM users u
WHERE p.email = u.email
  AND p.user_id IS NULL;

-- Verify
SELECT
  COUNT(*) FILTER (WHERE user_id IS NULL) as still_null,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as fixed,
  COUNT(*) as total
FROM profiles;
```

## 📋 Expected Output

After running the migration, you should see output like:

```
========================================
📊 BEFORE FIX - Current Status:
========================================
Total profiles: 20
NULL user_ids: 15
Valid user_ids: 5

========================================
✅ UPDATE COMPLETED
========================================
Records updated: 15

========================================
📊 AFTER FIX - Final Status:
========================================
Total profiles: 20
Fixed (valid user_ids): 20
Still NULL: 0

✅ SUCCESS: All profiles now have valid user_ids!
========================================
```

## ⚠️ What if Some Records Remain NULL?

If some profiles still have NULL user_ids after running the fix, it means:

**Reason:** Those profiles don't have matching users in the `users` table

**Solutions:**

### Solution 1: Create Missing Users

```sql
-- Find emails in profiles that don't exist in users
SELECT DISTINCT p.email
FROM profiles p
LEFT JOIN users u ON p.email = u.email
WHERE p.user_id IS NULL
  AND u.id IS NULL;

-- Create missing users manually
INSERT INTO users (email, first_name, last_name, role)
SELECT
  p.email,
  p.first_name,
  p.last_name,
  'user'
FROM profiles p
LEFT JOIN users u ON p.email = u.email
WHERE p.user_id IS NULL
  AND u.id IS NULL;

-- Now re-run the fix query
UPDATE profiles p
SET user_id = u.id
FROM users u
WHERE p.email = u.email
  AND p.user_id IS NULL;
```

### Solution 2: Delete Orphaned Profiles

⚠️ **Warning:** This will permanently delete profiles without matching users!

```sql
-- CAREFUL: This deletes profiles permanently!
DELETE FROM profiles
WHERE user_id IS NULL;
```

## 🧪 Testing After Fix

### Test 1: Check if all profiles have user_ids

```sql
SELECT COUNT(*) as null_count
FROM profiles
WHERE user_id IS NULL;
```

**Expected:** `null_count = 0`

### Test 2: Verify foreign key works

```sql
-- This should work now (joins profiles with users)
SELECT
  p.id as profile_id,
  p.email,
  p.first_name,
  u.id as user_id,
  u.email as user_email
FROM profiles p
INNER JOIN users u ON p.user_id = u.id
LIMIT 5;
```

**Expected:** All profiles should successfully join with users

### Test 3: Create new profile (test in app)

1. Go to `/welcome-to-linkist`
2. Fill the form
3. Submit
4. Check database:

```sql
SELECT
  id,
  user_id,
  email,
  first_name,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** `user_id` should have a valid UUID (not NULL)

## 📊 Monitoring Queries

### Check overall health

```sql
SELECT
  'Profiles' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as without_user_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE user_id IS NOT NULL) / COUNT(*), 2) || '%' as health_percentage
FROM profiles;
```

### Find recent profiles

```sql
SELECT
  LEFT(id::TEXT, 8) || '...' as id,
  LEFT(user_id::TEXT, 8) || '...' as user_id,
  email,
  first_name,
  CASE
    WHEN user_id IS NOT NULL THEN '✅ Valid'
    ELSE '❌ NULL'
  END as status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

## ✅ Success Criteria

Migration is successful when:

- [x] All profiles have `user_id` populated (not NULL)
- [x] Foreign key constraint works properly
- [x] New profiles automatically get `user_id` on creation
- [x] No orphaned profiles remain (or handled appropriately)

## 🔧 Troubleshooting

### Issue: "Foreign key constraint violation"

**Solution:** Make sure migration `007_fix_user_id_foreign_keys.sql` ran first

```sql
-- Check if foreign key exists
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name = 'profiles_user_id_fkey';
```

### Issue: "Column user_id does not exist"

**Solution:** Run migration 007 first to create the column

```sql
-- Add user_id column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID;
```

### Issue: Updates aren't working

**Solution:** Check if service role key is being used (RLS policies)

```sql
-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after fix
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 📝 Notes

- This migration is **idempotent** - safe to run multiple times
- Only updates records where `user_id IS NULL`
- Existing valid user_ids are preserved
- Uses email matching to link profiles to users
- Shows detailed output for verification

## 🎉 Next Steps

After running this migration:

1. ✅ Verify all profiles have user_ids
2. ✅ Test creating new profiles in the app
3. ✅ Check that user_id auto-populates for new records
4. ✅ Review and handle any orphaned profiles
5. ✅ Monitor for any future NULL user_ids

---

**Created:** 2025-10-17
**Migration File:** `supabase/migrations/008_fix_null_user_ids.sql`
**Status:** Ready to run
