# Country Fields Update - Users Table

## 📋 Overview
Updated the application to store **country** and **country_code** separately in the `users` table along with the phone number.

## 🎯 What Changed

### Database Schema
Added two new columns to `users` table:
- `country` (TEXT): User's country/region (e.g., "India", "UAE", "USA", "UK")
- `country_code` (TEXT): Phone country code (e.g., "+91", "+971", "+1", "+44")

### Updated Files

1. **Migration File** ✅
   - `supabase/migrations/add_country_fields_to_users.sql`
   - Adds country and country_code columns
   - Creates index on country for faster queries

2. **SupabaseUserStore** ✅
   - `lib/supabase-user-store.ts`
   - Updated `SupabaseUser` interface to include country fields
   - Updated `CreateUserInput` interface
   - Updated insert logic to save country data

3. **Profile API** ✅
   - `app/api/user/profile/route.ts`
   - Now accepts `countryCode` in request body
   - Passes country and countryCode to database

4. **Welcome Page** ✅
   - `app/welcome-to-linkist/page.tsx`
   - Sends `countryCode` along with other form data

## 📊 Data Structure

### Before:
```json
{
  "email": "user@example.com",
  "phone_number": "+919876543210"
}
```

### After:
```json
{
  "email": "user@example.com",
  "phone_number": "+919876543210",
  "country": "India",
  "country_code": "+91"
}
```

## 🚀 How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new)
2. Copy the SQL from `supabase/migrations/add_country_fields_to_users.sql`
3. Paste and click "Run"

### Option 2: Using Script
```bash
cd scripts
./add-country-fields.sh
# Follow the displayed instructions
```

## 🔍 Migration SQL
```sql
-- Add country and country_code fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Create index on country for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

-- Add comments for documentation
COMMENT ON COLUMN users.country IS 'User country/region (e.g., India, UAE, USA, UK)';
COMMENT ON COLUMN users.country_code IS 'Phone country code (e.g., +91, +971, +1, +44)';
```

## ✅ Verification

After running the migration, you can verify:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('country', 'country_code');

-- Check existing data (should show NULL for old records)
SELECT email, country, country_code, phone_number
FROM users
LIMIT 5;
```

## 📝 Usage Example

### Frontend (Welcome Form)
```typescript
const response = await fetch('/api/user/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    country: 'India',              // New field
    countryCode: '+91',            // New field
    mobile: '+919876543210',
    onboarded: true
  })
});
```

### Backend (API)
```typescript
const user = await SupabaseUserStore.upsertByEmail({
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+919876543210',
  country: 'India',                // New field
  country_code: '+91',             // New field
  role: 'user'
});
```

## 🎯 Benefits

1. **Separate Country Information**: Country is now separate from phone number
2. **Easy Filtering**: Can filter users by country using indexed column
3. **Better Analytics**: Can analyze user distribution by country
4. **Flexible**: Old records work fine (NULL values for country fields)
5. **Backward Compatible**: Existing code continues to work

## ⚠️ Important Notes

- Existing users will have `NULL` values for country and country_code
- The `phone_number` field still contains the full number with country code
- New registrations will automatically populate these fields
- The migration is safe and won't affect existing data

## 🔄 Rollback (If Needed)

If you need to remove these columns:

```sql
ALTER TABLE users
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS country_code;

DROP INDEX IF EXISTS idx_users_country;
```

## 📞 Support

If you encounter any issues:
1. Check Supabase logs in the dashboard
2. Verify environment variables in `.env.local`
3. Test with a new user registration
4. Check console logs for errors

---

**Status**: ✅ Ready to Deploy
**Last Updated**: October 15, 2025
**Migration File**: `supabase/migrations/add_country_fields_to_users.sql`
