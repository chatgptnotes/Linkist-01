# Fix: Reload Supabase Schema Cache

## Problem
Error: "Could not find the 'profile_url' column of 'profiles' in the schema cache"

Even though the columns exist in your database, Supabase's PostgREST API cache is outdated.

## Solution: Reload Schema Cache

### Method 1: Reload via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw

2. **Navigate to API Settings**
   - Click on **Settings** (gear icon in sidebar)
   - Click on **API** tab

3. **Reload Schema**
   - Scroll down to find **"Schema Cache"** section
   - Click **"Reload schema"** button
   - Wait 5-10 seconds for reload to complete

4. **Verify**
   - Go back to your app: http://localhost:3000/claim-url
   - Try claiming username "poonam"
   - Should work without errors now!

### Method 2: SQL Command (Alternative)

If the dashboard method doesn't work, run this SQL:

```sql
-- Run in Supabase SQL Editor
NOTIFY pgrst, 'reload schema';
```

### Method 3: Restart PostgREST Service

1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/settings/infrastructure
2. Find **PostgREST** service
3. Click **Restart**
4. Wait 30 seconds for service to come back online

## How to Confirm Cache is Reloaded

### Test 1: Check API Response
```bash
curl -X POST http://localhost:3000/api/claim-url/save \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","email":"test@example.com"}'
```

**Before cache reload:**
```json
{
  "error": "Failed to save username"
}
```

**After cache reload:**
```json
{
  "success": true,
  "username": "testuser123",
  "profileUrl": "http://localhost:3000/testuser123"
}
```

### Test 2: Check Server Logs
**Before:** Error logs showing "Could not find column"
**After:** Clean 200 OK response, no errors

### Test 3: Check Database
1. Go to Supabase Table Editor
2. Open `profiles` table
3. Look for your test record
4. Should see `custom_url` and `profile_url` populated

## Why This Happens

Supabase uses PostgREST which caches the database schema for performance. When you:
1. Add new columns (like `custom_url` and `profile_url`)
2. Or modify table structure
3. The cache doesn't automatically update

**You must manually reload** the schema cache after any DDL (Data Definition Language) changes.

## When to Reload Schema Cache

Reload the cache whenever you:
- ✅ Add new columns to tables
- ✅ Drop columns
- ✅ Add/remove constraints
- ✅ Create new tables
- ✅ Modify RLS policies
- ✅ Add/remove indexes

## Next Steps After Reload

1. ✅ Test URL claiming feature
2. ✅ Verify database storage
3. ✅ Check public profile pages
4. ✅ Run complete testing guide

**Reload the cache now and your feature will work!** 🚀
