# Fix: custom_url Not Being Stored

## Problem
The `custom_url` column doesn't exist in your Supabase `profiles` table, so usernames are not being saved to the database.

## Current Status
From the logs:
- ✅ API request succeeds (200 OK)
- ⚠️ Error: "Could not find the 'profile_url' column"
- ⚠️ Username not stored because columns are missing

## Solution: Add Missing Columns to Database

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
2. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration
1. Open the file: `ADD_CUSTOM_URL_COLUMN.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

### Step 3: What This Migration Does

The migration will:
1. ✅ Add `custom_url` column (stores username like "poonam")
2. ✅ Add `profile_url` column (stores full URL like "http://localhost:3000/poonam")
3. ✅ Add UNIQUE constraint (prevents duplicate usernames)
4. ✅ Create indexes (faster lookups)
5. ✅ Add RLS policy (allows public viewing of profiles)

### Step 4: Verify It Worked

After running the migration, you should see output like:
```
Column custom_url added successfully
Column profile_url added successfully
Unique constraint on custom_url added
RLS policy created for public profile viewing
```

### Step 5: Test the Feature

1. **Claim a URL**:
   - Visit: http://localhost:3000/claim-url
   - Enter username: "poonam"
   - Click "Claim URL"
   - ✅ Should see: "Success! Your profile is now available at: http://localhost:3000/poonam"

2. **Check Database**:
   - Go back to Supabase Table Editor
   - Click on `profiles` table
   - You should see new columns: `custom_url` and `profile_url`
   - Find your profile and see: `custom_url: "poonam"` and `profile_url: "http://localhost:3000/poonam"`

3. **View Public Profile**:
   - Visit: http://localhost:3000/poonam
   - ✅ Should show your public profile page with all styling

## Why This Happened

The `profiles` table was created with the original schema, but the `custom_url` and `profile_url` columns were added later as part of the custom URL feature. Your database needs to be migrated to include these new columns.

## What If Migration Fails?

If you see any errors when running the migration, send me the error message. Common issues:
- **Permission error**: Make sure you're using the Supabase service role key
- **Column already exists**: That's fine! The migration checks for existing columns
- **Table not found**: Verify the table name is exactly `profiles` (lowercase)

## Files Created
- `ADD_CUSTOM_URL_COLUMN.sql` - Complete migration script
- This file - Instructions

## Next Steps After Migration

Once the columns are added:
1. ✅ Username claiming will work perfectly
2. ✅ Full URLs will be stored in database
3. ✅ Public profile pages will be accessible
4. ✅ No more "column not found" errors

Run the migration now and test again!
