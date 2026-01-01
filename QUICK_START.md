# 🚀 Quick Start - Custom URL Feature

## 1️⃣ Run Database Migration (Required First!)

Open Supabase Dashboard → SQL Editor → Run this file:
```
supabase/migrations/ensure_profile_columns.sql
```

**Or use Supabase CLI:**
```bash
supabase db push
```

## 2️⃣ Start Development Server

```bash
npm run dev
```

## 3️⃣ Test the Feature

### Step 1: Claim URL
Visit: `http://localhost:3001/claim-url`
- Enter username: `bhupendra` (or any name)
- Click "Claim URL"

### Step 2: View Profile
Visit: `http://localhost:3001/bhupendra`
- Your profile page should appear!

## 📁 New Files Added

```
app/
├── [username]/page.tsx           # Public profile page
└── api/profile/[username]/route.ts  # Profile API

supabase/migrations/
└── ensure_profile_columns.sql    # Database migration

CUSTOM_URL_FEATURE.md             # Full documentation
FEATURE_SUMMARY.md                # Feature overview
setup-custom-urls.sh              # Setup script
```

## 🔗 Important URLs

- Claim page: `/claim-url`
- Public profile: `/[username]`
- API check: `POST /api/claim-url/check`
- API save: `POST /api/claim-url/save`
- API get: `GET /api/profile/[username]`

## 🎯 What You Can Do Now

✅ Users can claim custom URLs like `linkist.com/bhupendra`
✅ Each user gets a beautiful public profile page
✅ Share profile with one simple link
✅ Download contact as vCard
✅ Display social media links
✅ Contact form for reaching out

## 📖 Need More Info?

- Full docs: `CUSTOM_URL_FEATURE.md`
- Feature summary: `FEATURE_SUMMARY.md`
- Setup script: `./setup-custom-urls.sh`

---

**Ready? Run the migration and start claiming URLs! 🎉**
