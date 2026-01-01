# Full URL Storage Feature

## Overview
Ab system **complete URL store karega** database mein, jo environment ke basis par automatically set hoga.

## Kya Store Hoga?

### Database mein 2 fields hongi:

1. **`custom_url`** - Sirf username (e.g., "bhupendra")
2. **`profile_url`** - Pura URL (e.g., "http://localhost:3001/bhupendra")

## Environment-Based URLs

### Development (Local)
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```
**Result:** `http://localhost:3001/bhupendra`

### Production (Server)
```bash
NEXT_PUBLIC_SITE_URL=https://linkist.com
```
**Result:** `https://linkist.com/bhupendra`

## Database Schema

### New Column Added: `profile_url`

```sql
ALTER TABLE public.profiles ADD COLUMN profile_url TEXT;
CREATE INDEX idx_profiles_profile_url ON public.profiles(profile_url);
```

### Example Data

| custom_url | profile_url |
|-----------|-------------|
| bhupendra | http://localhost:3001/bhupendra |
| amit-bala | http://localhost:3001/amit-bala |
| tipu | http://localhost:3001/tipu |

**Production mein:**

| custom_url | profile_url |
|-----------|-------------|
| bhupendra | https://linkist.com/bhupendra |
| amit-bala | https://linkist.com/amit-bala |
| tipu | https://linkist.com/tipu |

## Kaise Kaam Karta Hai?

### 1. User Claims Username

```
User enters: "bhupendra"
↓
API generates full URL:
- Dev: http://localhost:3001/bhupendra
- Prod: https://linkist.com/bhupendra
↓
Database saves both:
- custom_url: "bhupendra"
- profile_url: "http://localhost:3001/bhupendra"
```

### 2. API Response

```json
{
  "success": true,
  "username": "bhupendra",
  "profileUrl": "http://localhost:3001/bhupendra",
  "message": "Username saved successfully"
}
```

### 3. User Ko Dikhta Hai

```
Success! Your profile is now available at:
http://localhost:3001/bhupendra
```

## Files Updated

### 1. Migration File
```
supabase/migrations/add_full_profile_url.sql
```
- Adds `profile_url` column
- Creates index
- Updates existing profiles

### 2. API Route
```
app/api/claim-url/save/route.ts
```
**Changes:**
- Gets base URL from `NEXT_PUBLIC_SITE_URL`
- Creates full URL: `baseUrl + '/' + username`
- Saves both `custom_url` and `profile_url`
- Returns full URL in response

### 3. Claim URL Page
```
app/claim-url/page.tsx
```
**Changes:**
- Stores full URL in localStorage
- Shows success alert with complete URL
- User can copy/share full URL

## Setup Steps

### 1. Run Migration

**Option A: Supabase Dashboard**
```sql
-- Go to SQL Editor
-- Run: supabase/migrations/add_full_profile_url.sql
```

**Option B: CLI**
```bash
supabase db push
```

### 2. Verify Environment Variable

Check `.env` file:
```bash
# For local development
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# For production (update before deploying)
NEXT_PUBLIC_SITE_URL=https://linkist.com
```

### 3. Rebuild Application

```bash
rm -rf .next
npm run build
npm run dev
```

## Testing

### Test 1: Local Development

```bash
# Start server
npm run dev

# Claim URL
Visit: http://localhost:3002/claim-url
Enter: testuser
Click: Claim URL

# Check Response
Should show: "Your profile is now available at: http://localhost:3001/testuser"
```

### Test 2: Database Verification

```sql
-- Check stored values
SELECT
  custom_url,
  profile_url,
  first_name,
  last_name
FROM profiles
WHERE custom_url = 'testuser';

-- Expected result:
-- custom_url: testuser
-- profile_url: http://localhost:3001/testuser
```

### Test 3: API Test

```bash
# Test save API
curl -X POST http://localhost:3002/api/claim-url/save \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newtestuser",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }'

# Expected response:
# {
#   "success": true,
#   "username": "newtestuser",
#   "profileUrl": "http://localhost:3001/newtestuser",
#   "message": "Username saved successfully"
# }
```

## Production Deployment

### Before Deploying to Server:

1. **Update .env file:**
```bash
NEXT_PUBLIC_SITE_URL=https://linkist.com
```

2. **Rebuild:**
```bash
npm run build
```

3. **Deploy**

4. **Verify URLs:**
```sql
-- After first user claims URL on production
SELECT custom_url, profile_url
FROM profiles
WHERE custom_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Should show: https://linkist.com/username
```

## Benefits

### ✅ Complete URL Storage
- Full URL stored in database
- No need to construct URL later
- Easy sharing and QR code generation

### ✅ Environment Aware
- Automatically uses correct domain
- Local: localhost:3001
- Production: linkist.com

### ✅ Easy Integration
- NFC cards can store full URL
- QR codes can use full URL
- Email notifications include full URL
- Share functionality gets full URL

## Use Cases

### 1. NFC Card Programming
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('profile_url')
  .eq('email', userEmail)
  .single();

// Write to NFC card
nfcTag.write(profile.profile_url);
// Result: http://localhost:3001/bhupendra
```

### 2. QR Code Generation
```javascript
import QRCode from 'qrcode';

const { data: profile } = await supabase
  .from('profiles')
  .select('profile_url')
  .eq('custom_url', username)
  .single();

const qrCode = await QRCode.toDataURL(profile.profile_url);
// QR code contains: http://localhost:3001/bhupendra
```

### 3. Email Notifications
```javascript
const emailTemplate = `
  Your Linkist profile is live!

  View your profile at: ${profile.profile_url}

  Share this link with your contacts.
`;
```

### 4. WhatsApp Sharing (DoubleTick API)
```javascript
const message = `
  Check out my profile: ${profile.profile_url}
`;

// Send via WhatsApp API
await sendWhatsAppMessage({
  to: phoneNumber,
  message: message
});
```

## API Updates

### Save API Response
```typescript
// Before
{
  success: true,
  username: "bhupendra"
}

// After
{
  success: true,
  username: "bhupendra",
  profileUrl: "http://localhost:3001/bhupendra"  // ✅ NEW
}
```

### Database Structure
```typescript
interface Profile {
  id: string;
  email: string;
  custom_url: string;          // "bhupendra"
  profile_url: string;          // "http://localhost:3001/bhupendra" ✅ NEW
  first_name: string;
  last_name: string;
  // ... other fields
}
```

## Troubleshooting

### Issue: Profile URL is NULL

**Fix:**
```sql
-- Update existing profiles
UPDATE profiles
SET profile_url = 'http://localhost:3001/' || custom_url
WHERE custom_url IS NOT NULL
AND profile_url IS NULL;
```

### Issue: Wrong Domain in URL

**Check:**
```bash
# Verify environment variable
echo $NEXT_PUBLIC_SITE_URL

# Should be:
# Local: http://localhost:3001
# Production: https://linkist.com
```

**Fix:**
```bash
# Update .env
NEXT_PUBLIC_SITE_URL=https://linkist.com

# Rebuild
rm -rf .next
npm run build
```

### Issue: Old URLs Still Show localhost

**Solution:**
```sql
-- Update all URLs to production domain
UPDATE profiles
SET profile_url = REPLACE(profile_url, 'http://localhost:3001', 'https://linkist.com')
WHERE profile_url LIKE 'http://localhost:3001%';
```

## Summary

### ✅ What's Done:
1. ✅ `profile_url` column added to database
2. ✅ API saves full URL based on environment
3. ✅ User sees complete URL after claiming
4. ✅ Full URL stored in localStorage
5. ✅ Environment-aware URL generation

### 🚀 Next Steps:
1. Run migration: `add_full_profile_url.sql`
2. Test locally
3. Update `.env` for production
4. Deploy with correct domain
5. Verify URLs in production

---

**Feature Status:** ✅ Complete and Ready

**Local Testing:** `http://localhost:3001/username`
**Production:** `https://linkist.com/username` (after deployment)
