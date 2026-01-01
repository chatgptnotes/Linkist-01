# Supabase Database Migrations

This directory contains SQL migration files for setting up the Linkist NFC database schema.

## 🆕 Latest Migration: Auto-Create Profile System

### Problem Solved
- **Before**: `profiles.user_id` was NULL after user registration
- **After**: Profile automatically created with correct `user_id` foreign key link

### New Migration Files

#### 1. `fix-existing-null-user-ids.sql` ⚠️ RUN FIRST
**Purpose**: Fix existing profiles with NULL user_id
**What it does**:
- Creates profiles for users without profiles
- Links orphaned profiles to users via email match
- Reports any remaining orphaned profiles

**Run**: Copy and paste in Supabase SQL Editor

#### 2. `auto-create-profile-trigger.sql` ✅ RUN SECOND
**Purpose**: Automatic profile creation for future registrations
**What it does**:
- Creates PostgreSQL trigger on `users` table
- Auto-creates profile entry when user registers
- Sets `user_id` foreign key automatically

**Run**: Copy and paste in Supabase SQL Editor after fix script

### Quick Start
```sql
-- Step 1: Fix existing data
\i fix-existing-null-user-ids.sql

-- Step 2: Enable auto-creation
\i auto-create-profile-trigger.sql

-- Step 3: Verify
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as without_user_id
FROM profiles;
-- Should show 0 for without_user_id
```

---

## Migrations

### 003_create_users_table.sql
Creates the users table for authentication with the following features:

**Table Schema:**
- `id` - UUID primary key
- `email` - Unique email address (indexed)
- `first_name` - User's first name
- `last_name` - User's last name
- `phone_number` - Optional phone number
- `password_hash` - Password (should be bcrypt hashed in production)
- `role` - User role ('user' or 'admin')
- `email_verified` - Email verification status
- `mobile_verified` - Mobile verification status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Security:**
- Row Level Security (RLS) enabled
- Users can only read/update their own data
- Service role has full access
- Indexes on email and role for performance

**Test Users:**
- Admin: `admin@linkist.com` / `admin123456`
- User: `test@linkist.com` / `user123456`

## How to Run Migrations

### Option 1: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Run migrations:
```bash
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `003_create_users_table.sql`
4. Paste into the SQL Editor
5. Click "Run"

### Option 3: Manual SQL Execution

1. Connect to your Supabase database using psql or any PostgreSQL client
2. Execute the SQL file:
```bash
psql YOUR_DATABASE_URL -f supabase/migrations/003_create_users_table.sql
```

## After Migration

Once the migration is complete:

1. **Update API endpoints** to use Supabase instead of in-memory storage:
   - Uncomment Supabase code in `/app/api/auth/register/route.ts`
   - Uncomment Supabase code in `/app/api/auth/login/route.ts`

2. **Add bcrypt password hashing**:
   ```bash
   npm install bcryptjs
   npm install -D @types/bcryptjs
   ```

3. **Test with provided users**:
   - Admin: admin@linkist.com / admin123456
   - User: test@linkist.com / user123456

4. **Security checklist**:
   - [ ] Replace test user passwords
   - [ ] Implement bcrypt password hashing
   - [ ] Add rate limiting to auth endpoints
   - [ ] Enable HTTPS in production
   - [ ] Set secure environment variables

## Environment Variables Required

Make sure these are set in your `.env.local` or Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migration Status

- [x] 001_initial_schema.sql - Orders and products
- [x] 002_update_order_prefix.sql - Change NFC- to LNK-
- [ ] 003_create_users_table.sql - **Run this migration**

## Troubleshooting

**Error: relation "users" already exists**
- The table already exists. You can either:
  - Drop and recreate: `DROP TABLE users CASCADE;` then run migration
  - Or modify the migration to use `CREATE TABLE IF NOT EXISTS`

**Error: permission denied**
- Make sure you're using the service role key, not the anon key
- Check RLS policies are correctly configured

**Error: function gen_random_uuid() does not exist**
- Enable the pgcrypto extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```
