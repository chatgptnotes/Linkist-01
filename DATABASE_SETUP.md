# 🗄️ Database Setup for Custom URL Feature

## Your Current Schema

Based on your `profiles` table structure, the `custom_url` column already exists! ✅

```sql
custom_url text null,
constraint profiles_custom_url_key unique (custom_url),
```

## What the Feature Uses

### Profile Fields Mapping

| Database Column | Used For | Example |
|----------------|----------|---------|
| `custom_url` | Username in URL | "bhupendra" |
| `first_name` | First name | "Bhupendra" |
| `last_name` | Last name | "Doe" |
| `job_title` | Professional title | "CEO & Founder" |
| `company_name` | Company name | "Tech Co" |
| `professional_summary` | Bio/About section | "Passionate entrepreneur..." |
| `profile_photo_url` | Profile picture | Image URL |
| `background_image_url` | Cover image | Image URL |
| `primary_email` | Contact email | "bhupendra@example.com" |
| `mobile_number` | Phone number | "+1 234 567 8900" |
| `whatsapp_number` | WhatsApp | "+1 234 567 8900" |
| `company_website` | Website link | "https://example.com" |
| `company_address` | Location | "San Francisco, CA" |
| `social_links` | Social media (JSONB) | `{"linkedin": "...", "twitter": "..."}` |

### Social Links Format (JSONB)

```json
{
  "linkedin": "https://linkedin.com/in/bhupendra",
  "twitter": "https://twitter.com/bhupendra",
  "instagram": "https://instagram.com/bhupendra",
  "facebook": "https://facebook.com/bhupendra",
  "youtube": "https://youtube.com/@bhupendra",
  "github": "https://github.com/bhupendra"
}
```

## Migration to Run

Since your schema already has `custom_url`, you only need to run the enhanced migration:

### File: `supabase/migrations/add_custom_url_support.sql`

This migration adds:
1. ✅ Unique constraint on `custom_url` (if missing)
2. ✅ Index for fast lookups
3. ✅ Public viewing policy
4. ✅ Validation trigger (format checking)
5. ✅ Helpful comments on columns
6. ✅ Public view for easier querying

### Run the Migration

**Option 1: Supabase Dashboard**
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/add_custom_url_support.sql`
3. Click "Run"

**Option 2: Supabase CLI**
```bash
supabase db push
```

**Option 3: Direct SQL**
```bash
psql $DATABASE_URL -f supabase/migrations/add_custom_url_support.sql
```

## Verify Setup

After running the migration, verify everything is ready:

```sql
-- Check custom_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'custom_url';

-- Check unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles'
AND constraint_name = 'profiles_custom_url_key';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname = 'idx_profiles_custom_url';

-- Check RLS policy
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Allow public to view profiles by custom_url';
```

Expected output:
```
✅ custom_url | text | YES
✅ profiles_custom_url_key | UNIQUE
✅ idx_profiles_custom_url | CREATE INDEX...
✅ Allow public to view profiles by custom_url | PERMISSIVE | {public}
```

## Test Data Setup

### Create a Test Profile

```sql
-- Insert a test profile with custom URL
INSERT INTO public.profiles (
  email,
  custom_url,
  first_name,
  last_name,
  job_title,
  company_name,
  professional_summary,
  primary_email,
  mobile_number,
  company_website,
  company_address,
  social_links
) VALUES (
  'bhupendra@test.com',
  'bhupendra',
  'Bhupendra',
  'Kumar',
  'CEO & Founder',
  'Tech Innovations Inc',
  'Passionate entrepreneur and technology enthusiast with over 10 years of experience.',
  'bhupendra@test.com',
  '+91 98765 43210',
  'https://techinnovations.com',
  'Mumbai, India',
  '{"linkedin": "https://linkedin.com/in/bhupendra", "twitter": "https://twitter.com/bhupendra", "instagram": "https://instagram.com/bhupendra"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;
```

### View Test Profile

```sql
-- Query by custom_url
SELECT
  custom_url,
  first_name,
  last_name,
  job_title,
  company_name,
  primary_email,
  social_links
FROM public.profiles
WHERE custom_url = 'bhupendra';
```

### Test via API

```bash
# Check if username is available
curl -X POST http://localhost:3001/api/claim-url/check \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123"}'

# Save a username
curl -X POST http://localhost:3001/api/claim-url/save \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser123",
    "firstName":"Test",
    "lastName":"User",
    "email":"test@example.com"
  }'

# Get profile by username
curl http://localhost:3001/api/profile/bhupendra
```

## Common Issues & Solutions

### Issue: "custom_url column doesn't exist"
**Solution:** Your schema already has it! Just run the migration to add policies.

### Issue: "duplicate key value violates unique constraint"
**Solution:** Username is already taken. Try a different one.

```sql
-- Check existing usernames
SELECT custom_url, first_name, last_name, email
FROM profiles
WHERE custom_url IS NOT NULL;
```

### Issue: "permission denied for table profiles"
**Solution:** Check RLS policies are set up correctly.

```sql
-- Add public viewing policy
DROP POLICY IF EXISTS "Allow public to view profiles by custom_url" ON public.profiles;
CREATE POLICY "Allow public to view profiles by custom_url"
    ON public.profiles FOR SELECT
    USING (custom_url IS NOT NULL);
```

### Issue: Profile shows but no data
**Solution:** Update the profile with actual data.

```sql
UPDATE profiles
SET
  first_name = 'Your Name',
  job_title = 'Your Title',
  professional_summary = 'Your bio',
  social_links = '{"linkedin": "your-linkedin-url"}'::jsonb
WHERE custom_url = 'your-username';
```

## Data Flow Diagram

```
┌─────────────────┐
│  /claim-url     │
│  User enters    │
│  "bhupendra"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check API       │
│ Is it available?│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save API        │
│ INSERT/UPDATE   │
│ custom_url      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ profiles table  │
│ custom_url =    │
│ "bhupendra"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /bhupendra      │
│ Public page     │
│ displays data   │
└─────────────────┘
```

## API to Database Mapping

When you visit `/bhupendra`, here's what happens:

1. **Frontend**: Request to `GET /api/profile/bhupendra`
2. **API**: Query `SELECT * FROM profiles WHERE custom_url = 'bhupendra'`
3. **Transform**: Database fields → Frontend format
4. **Display**: Render on `/bhupendra` page

```typescript
// Database → Frontend transformation
{
  // Database columns
  custom_url: 'bhupendra',
  first_name: 'Bhupendra',
  job_title: 'CEO',
  profile_photo_url: 'https://...',
  social_links: {"linkedin": "..."}

  // Transformed to
  username: 'bhupendra',
  firstName: 'Bhupendra',
  title: 'CEO',
  profileImage: 'https://...',
  linkedin: '...'
}
```

## Security Notes

✅ **Public access is safe** - Only profiles with `custom_url` are viewable
✅ **SQL injection protected** - Using parameterized queries
✅ **Format validation** - Trigger checks username format
✅ **Unique constraint** - Prevents duplicate usernames
✅ **RLS enabled** - Row Level Security active

## Next Steps

1. ✅ Run the migration: `supabase/migrations/add_custom_url_support.sql`
2. ✅ Verify with SQL queries above
3. ✅ Create test profile
4. ✅ Test in browser: `http://localhost:3001/bhupendra`
5. ✅ Start claiming URLs!

---

**Ready to go?** Your database structure is perfect for this feature! 🚀
