# Fix: Users Table Schema Cache Error

## Error
```
"Could not find the 'country' column of 'users' in the schema cache"
POST /api/user/profile 500
```

## Problem
Same issue as before - Supabase PostgREST schema cache is outdated for `users` table.

---

## Solution (2 Minutes)

### Step 1: Reload Schema Cache 🔴 CRITICAL

**Option A: Supabase Dashboard (Recommended)**
1. Open: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw
2. Go to: **Settings → API**
3. Scroll down to **"Schema Cache"** section
4. Click: **"Reload schema"** button
5. Wait 10 seconds

**Option B: SQL Command**
```sql
-- Run in Supabase SQL Editor
NOTIFY pgrst, 'reload schema';
```

**Option C: Restart PostgREST**
1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/settings/infrastructure
2. Find **PostgREST** service
3. Click **"Restart"**
4. Wait 30 seconds

---

## Why This Happens

Jab bhi aap database schema change karte ho (columns add/remove/modify), Supabase ka PostgREST API cache automatically update nahi hota.

**You must manually reload** after:
- ✅ Adding columns to tables
- ✅ Removing columns
- ✅ Modifying constraints
- ✅ Creating new tables
- ✅ Changing RLS policies

---

## Verification

### Before Schema Reload:
```bash
POST /api/user/profile 500
Error: "Could not find the 'country' column of 'users' in the schema cache"
```

### After Schema Reload:
```bash
POST /api/user/profile 200
✅ User created successfully
```

---

## Test After Reload

1. **Try Creating User Again:**
   - Fill welcome form
   - Click submit
   - Should work without errors

2. **Check Server Logs:**
   ```
   ✅ User created successfully
   POST /api/user/profile 200
   ```

3. **Check Database:**
   - Go to Supabase Table Editor
   - Open `users` table
   - Find new user with all fields populated

---

## One-Time Fix for All Tables

**Run this once to avoid future issues:**

```sql
-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify all columns are recognized
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'profiles')
ORDER BY table_name, ordinal_position;
```

---

## Production Tip

Set up automatic schema reloads in your deployment pipeline:

```bash
# After running migrations
curl -X POST https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/api/reload-schema \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

---

## Summary

**Problem:** Schema cache outdated
**Solution:** Reload schema cache (1 button click)
**Time:** 2 minutes
**Result:** New users can be created

**Ek baar reload karo, sab kaam karega!** 🚀
