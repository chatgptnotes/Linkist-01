# ✅ Custom URL Feature - Ready to Use!

## 🎉 Good News!

Your database already has the `custom_url` column! The feature is **90% ready**. You just need to run one migration to add the policies and validation.

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Run the Migration

Open **Supabase Dashboard** → **SQL Editor** → Run this file:
```
supabase/migrations/add_custom_url_support.sql
```

This adds:
- ✅ Public viewing policy
- ✅ URL format validation
- ✅ Database comments
- ✅ Helper view

### Step 2: Start Your Server

```bash
npm run dev
```

### Step 3: Test It!

1. **Claim a URL:** http://localhost:3001/claim-url
2. **Enter username:** `bhupendra`
3. **Click "Claim URL"**
4. **View profile:** http://localhost:3001/bhupendra

**Done!** 🎊

---

## 📋 What Each File Does

### New Files Created

```
app/
├── [username]/page.tsx                    # 👤 Public profile page
│                                          # Displays user info, contact, socials
│
└── api/profile/[username]/route.ts        # 🔌 Profile API endpoint
                                           # Fetches data from database

supabase/migrations/
├── add_custom_url_support.sql             # 🗄️ Main migration (RUN THIS!)
│                                          # Adds policies & validation
│
└── ensure_profile_columns.sql             # 📦 Backup migration
                                           # (Not needed - your schema is good)

Documentation/
├── DATABASE_SETUP.md                      # 📖 Database guide
├── CUSTOM_URL_FEATURE.md                  # 📚 Full documentation
├── FEATURE_SUMMARY.md                     # 📊 Overview
└── QUICK_START.md                         # ⚡ Quick reference
```

### Existing Files (Already Work!)

```
app/
├── claim-url/page.tsx                     # ✅ URL claiming page (no changes)
│
└── api/claim-url/
    ├── check/route.ts                     # ✅ Check availability (works)
    └── save/route.ts                      # ✅ Save username (works)
```

---

## 🎯 How It Works

### Your Database Schema (Already Perfect!)

```sql
profiles table:
├── custom_url TEXT UNIQUE        ← Username goes here
├── first_name VARCHAR(100)       ← User's first name
├── last_name VARCHAR(100)        ← User's last name
├── job_title VARCHAR(200)        ← Professional title
├── company_name VARCHAR(200)     ← Company name
├── professional_summary TEXT     ← Bio/about section
├── profile_photo_url TEXT        ← Profile picture
├── background_image_url TEXT     ← Cover image
├── primary_email VARCHAR(255)    ← Contact email
├── mobile_number VARCHAR(20)     ← Phone number
├── whatsapp_number VARCHAR(20)   ← WhatsApp number
├── company_website TEXT          ← Website URL
├── company_address TEXT          ← Location
└── social_links JSONB            ← Social media links
```

### Social Links Format

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

---

## 🔄 Complete User Flow

```
1. User visits /claim-url
   └─ Sees form to enter username

2. User types "bhupendra"
   └─ Real-time availability check
   └─ ✅ "Sweet! linkist.com/bhupendra is available"

3. User clicks "Claim URL"
   └─ Saves to database: custom_url = 'bhupendra'
   └─ Redirects to /profiles/builder

4. User completes profile
   └─ Fills in: name, title, bio, social links
   └─ Uploads profile picture

5. Profile goes live!
   └─ Visit: linkist.com/bhupendra
   └─ Beautiful public page appears
   └─ Share link with anyone 🎉
```

---

## 🧪 Testing Guide

### Test 1: Check if Database is Ready

```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'custom_url';
```

**Expected:**
```
custom_url | text
```
✅ If you see this, your database is ready!

### Test 2: Create a Test Profile

```sql
INSERT INTO profiles (
  email,
  custom_url,
  first_name,
  last_name,
  job_title,
  company_name,
  professional_summary,
  primary_email,
  mobile_number,
  social_links
) VALUES (
  'test@example.com',
  'testuser',
  'Test',
  'User',
  'Software Engineer',
  'Tech Corp',
  'Building amazing products',
  'test@example.com',
  '+1 234 567 8900',
  '{"linkedin": "https://linkedin.com/in/testuser"}'::jsonb
);
```

### Test 3: View Profile

Visit: http://localhost:3001/testuser

You should see:
- ✅ Name: Test User
- ✅ Title: Software Engineer
- ✅ Company: Tech Corp
- ✅ Bio: Building amazing products
- ✅ LinkedIn link
- ✅ Email button
- ✅ Phone button
- ✅ Save contact button

### Test 4: Claim a New Username

1. Go to: http://localhost:3001/claim-url
2. Enter: `mynewusername`
3. Click "Claim URL"
4. Check database:
   ```sql
   SELECT custom_url, first_name, last_name
   FROM profiles
   WHERE custom_url = 'mynewusername';
   ```

---

## 📱 Example Profiles

After setup, these URLs will work:

| URL | Shows |
|-----|-------|
| `linkist.com/bhupendra` | Bhupendra's profile |
| `linkist.com/john-doe` | John Doe's profile |
| `linkist.com/ceo-tech-2025` | Another user |

---

## 🎨 Profile Page Features

### What Users See

**Header:**
- Profile picture (or initial if none)
- Cover image (optional)
- Name, title, company
- Custom URL: `linkist.com/username`

**Action Buttons:**
- 📧 Email (opens mail client)
- 📞 Call (initiates phone call)
- 💾 Save Contact (downloads vCard)
- 🔗 Share (native share or copy link)

**Social Links:**
- LinkedIn, Twitter, Instagram
- Facebook, YouTube, GitHub
- Personal website

**Info Sections:**
- About/Bio
- Location
- Contact details
- Contact form

---

## 🔒 Security Features

✅ **Public viewing is safe** - Only users with `custom_url` are visible
✅ **SQL injection protected** - Parameterized queries
✅ **Format validation** - Trigger checks username format
✅ **Unique usernames** - Database constraint prevents duplicates
✅ **RLS enabled** - Row Level Security active

### Username Rules

- ✅ 3-30 characters
- ✅ Lowercase letters, numbers, hyphens
- ✅ Cannot start/end with hyphen
- ❌ No special characters (@, #, $, etc.)

**Valid:** `bhupendra`, `john-doe`, `ceo-2025`
**Invalid:** `-bhupendra`, `bh`, `user@123`

---

## 🐛 Troubleshooting

### Issue: "Profile not found"

**Check 1:** Is custom_url saved?
```sql
SELECT custom_url FROM profiles WHERE email = 'your@email.com';
```

**Check 2:** Is the policy set?
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Fix:** Run the migration again:
```sql
-- Copy from: supabase/migrations/add_custom_url_support.sql
```

### Issue: "Username already taken"

**Check who has it:**
```sql
SELECT email, first_name, last_name
FROM profiles
WHERE custom_url = 'bhupendra';
```

**Solution:** Choose a different username or update the existing one.

### Issue: "Cannot insert/update"

**Check RLS policies:**
```sql
-- Disable RLS temporarily for testing (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Monitor Usage

### View All Claimed URLs

```sql
SELECT
  custom_url,
  first_name,
  last_name,
  job_title,
  company_name,
  created_at
FROM profiles
WHERE custom_url IS NOT NULL
ORDER BY created_at DESC;
```

### Most Popular URLs (Future: Add view tracking)

```sql
-- This is a placeholder for future analytics
SELECT
  custom_url,
  COUNT(*) as views
FROM profile_analytics
WHERE event_type = 'profile_view'
GROUP BY custom_url
ORDER BY views DESC
LIMIT 10;
```

---

## 🎯 Integration with NFC Cards

When a user orders an NFC card:

1. After payment, redirect to `/claim-url`
2. User claims their username
3. Username gets programmed into NFC card
4. Tapping card → Opens `linkist.com/username`

### NFC Card Data

```json
{
  "type": "url",
  "url": "https://linkist.com/bhupendra",
  "ndef": {
    "recordType": "uri",
    "uri": "https://linkist.com/bhupendra"
  }
}
```

---

## 📈 Next Features (Future Ideas)

- [ ] Profile view analytics
- [ ] QR code generation
- [ ] Custom themes/colors
- [ ] Portfolio gallery
- [ ] Work experience timeline
- [ ] Skills showcase
- [ ] Testimonials
- [ ] SEO optimization
- [ ] Open Graph images
- [ ] PDF export

---

## ✅ Final Checklist

Before going live:

- [ ] Run migration: `add_custom_url_support.sql`
- [ ] Test claiming URL
- [ ] Test viewing profile
- [ ] Verify all fields display correctly
- [ ] Test on mobile devices
- [ ] Check social links work
- [ ] Test vCard download
- [ ] Test share functionality
- [ ] Update production .env
- [ ] Deploy to production

---

## 🎉 You're All Set!

Your custom URL feature is **ready to use**!

### Next Steps:

1. **Run the migration** (2 minutes)
2. **Test locally** (5 minutes)
3. **Deploy to production** (when ready)

### URLs to Remember:

- Claim page: `/claim-url`
- Profile page: `/[username]`
- API docs: See `CUSTOM_URL_FEATURE.md`

### Need Help?

- Full docs: `CUSTOM_URL_FEATURE.md`
- Database guide: `DATABASE_SETUP.md`
- Quick reference: `QUICK_START.md`

---

**Happy building!** 🚀

*Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase*
