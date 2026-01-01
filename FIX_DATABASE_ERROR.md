# Fix "Failed to save username" Error

## Error Message
```
Could not find the 'profile_url' column of 'profiles' in the schema cache
```

## Problem
The `profile_url` column doesn't exist in your Supabase database yet.

## Solution (2 Options)

### Option 1: Add the Column (Recommended for Full URL Storage)

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor

2. **Run the Migration**:
   - Click on "SQL Editor"
   - Copy the contents of `ADD_PROFILE_URL_COLUMN.sql`
   - Paste and click "Run"

3. **Verify**:
   - You should see: "Column profile_url added successfully"
   - The migration will also update existing profiles with full URLs

4. **Test**:
   - Go to: http://localhost:3000/claim-url
   - Try claiming a username like "poonam"
   - You should see: "Success! Your profile is now available at: http://localhost:3000/poonam"

### Option 2: Use Without profile_url Column (Temporary Fix)

The code has been updated to automatically fallback if the `profile_url` column doesn't exist. It will:
- Save the `custom_url` (just the username)
- Return the full URL to the frontend anyway
- Not store the full URL in database (only in `custom_url`)

**This option works immediately but:**
- ⚠️ Full URL won't be stored in database
- ⚠️ You'll need to construct the URL programmatically each time
- ✅ Custom URL claiming will work right now

## What Was Fixed

1. ✅ **Next.js 15 async params warning** - Updated API route to await params
2. ✅ **Error handling for missing columns** - Code now handles missing `profile_url` column gracefully
3. ✅ **Fallback mechanism** - If database columns don't exist, the feature still works

## Current Status

- **Server**: ✅ Running on http://localhost:3000
- **CSS**: ✅ Loading correctly
- **API**: ✅ Responding (with fallback)
- **profile_url column**: ⚠️ Needs to be added to database

## Quick Test Without Database Changes

You can test the feature right now:

1. Visit: http://localhost:3000/claim-url
2. Enter username: "testuser"
3. Click "Claim URL"
4. It will save the username (without full URL) and show success message

## For Production

When deploying to production, update `.env`:
```bash
NEXT_PUBLIC_SITE_URL=https://linkist.com
```

Then URLs will be stored as: `https://linkist.com/username`
