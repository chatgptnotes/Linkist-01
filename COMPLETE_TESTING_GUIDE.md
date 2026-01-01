# Complete Testing Guide - Custom URL Feature

## Overview
This guide will walk you through testing the complete custom URL feature step-by-step.

---

## Prerequisites (MUST DO FIRST!)

### 1. Reload Supabase Schema Cache ✅
**Why:** Supabase cache is outdated and showing "column not found" error

**How:**
1. Open: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw
2. Go to: **Settings → API**
3. Scroll to **"Schema Cache"** section
4. Click **"Reload schema"** button
5. Wait 10 seconds

**Alternative:** Run in SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

### 2. Add RLS Policies ✅
**Why:** Enable public viewing and secure database operations

**How:**
1. Open: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
2. Click **"SQL Editor"**
3. Copy ALL contents from `ADD_RLS_POLICIES.sql`
4. Paste and click **"Run"**
5. Verify you see success messages

---

## Testing Phase 1: Claim URL Flow

### Test 1.1: Access Claim URL Page
1. **Action:** Visit http://localhost:3000/claim-url
2. **Expected:**
   - ✅ Page loads with full styling
   - ✅ Linkist logo visible
   - ✅ Input field shows "linkist.com/"
   - ✅ URL guidelines displayed

### Test 1.2: Check Username Availability
1. **Action:** Type "poonam" in the username field
2. **Expected:**
   - ✅ Input accepts the text
   - ✅ No errors shown
   - ✅ "Claim URL" button enabled

### Test 1.3: Claim Username
1. **Action:** Click "Claim URL" button
2. **Expected:**
   - ✅ Success message appears:
     ```
     Success! Your profile is now available at:
     http://localhost:3000/poonam
     ```
   - ✅ Redirects to profile builder page
   - ✅ No error in browser console

### Test 1.4: Verify Database Storage
1. **Action:** Open Supabase Table Editor
   - Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
   - Click on `profiles` table
2. **Expected:**
   - ✅ Find row with your email
   - ✅ `custom_url` column: "poonam"
   - ✅ `profile_url` column: "http://localhost:3000/poonam"
   - ✅ Both fields populated correctly

---

## Testing Phase 2: Public Profile Pages

### Test 2.1: Access Profile by Username
1. **Action:** Visit http://localhost:3000/poonam
2. **Expected:**
   - ✅ Profile page loads (not 404)
   - ✅ Full CSS styling applied
   - ✅ Navigation bar visible
   - ✅ Profile layout rendered

### Test 2.2: Verify Profile Content
1. **Action:** Check page content
2. **Expected:**
   - ✅ Name displayed (if set in profile)
   - ✅ Job title/company (if set)
   - ✅ Profile photo placeholder or image
   - ✅ Contact actions (email, call, save vCard)
   - ✅ Social media links (if configured)

### Test 2.3: Test Different Usernames
1. **Action:** Try accessing:
   - http://localhost:3000/nonexistent-user
2. **Expected:**
   - ✅ Shows "Profile not found" or 404 page
   - ✅ Does not crash

---

## Testing Phase 3: Duplicate Prevention

### Test 3.1: Try Claiming Same Username
1. **Action:**
   - Logout (if needed)
   - Go to http://localhost:3000/claim-url
   - Try to claim "poonam" again
2. **Expected:**
   - ✅ Error message: "Username is already taken"
   - ✅ Cannot claim duplicate username
   - ✅ Database enforces UNIQUE constraint

### Test 3.2: Try Different Username
1. **Action:** Claim username "testuser"
2. **Expected:**
   - ✅ Success! New username claimed
   - ✅ Database has new row
   - ✅ http://localhost:3000/testuser works

---

## Testing Phase 4: Edge Cases

### Test 4.1: Invalid Usernames
Try these invalid usernames and verify they're rejected:

| Username | Expected Error |
|----------|----------------|
| `ab` | "Must be between 3 and 30 characters" |
| `a-very-long-username-that-exceeds-thirty` | "Must be between 3 and 30 characters" |
| `Poonam` | "Can only contain letters, numbers, and hyphens" (uppercase not allowed) |
| `poo_nam` | "Can only contain letters, numbers, and hyphens" (underscore not allowed) |
| `-poonam` | "Cannot start or end with a hyphen" |
| `poonam-` | "Cannot start or end with a hyphen" |
| `poo nam` | "Can only contain letters, numbers, and hyphens" (space not allowed) |

### Test 4.2: Valid Username Formats
Try these valid usernames - all should work:

- ✅ `poonam`
- ✅ `poonam-sharma`
- ✅ `poonam123`
- ✅ `poo-nam-123`

---

## Testing Phase 5: API Endpoints

### Test 5.1: Check Username Availability API
```bash
curl -X POST http://localhost:3000/api/claim-url/check \
  -H "Content-Type: application/json" \
  -d '{"username":"availableuser"}'
```

**Expected Response:**
```json
{
  "available": true
}
```

Try with existing username:
```bash
curl -X POST http://localhost:3000/api/claim-url/check \
  -H "Content-Type: application/json" \
  -d '{"username":"poonam"}'
```

**Expected Response:**
```json
{
  "available": false
}
```

### Test 5.2: Save Username API
```bash
curl -X POST http://localhost:3000/api/claim-url/save \
  -H "Content-Type: application/json" \
  -d '{
    "username":"apitest",
    "firstName":"API",
    "lastName":"Test",
    "email":"apitest@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "username": "apitest",
  "profileUrl": "http://localhost:3000/apitest",
  "message": "Username saved successfully"
}
```

### Test 5.3: Fetch Profile API
```bash
curl http://localhost:3000/api/profile/poonam
```

**Expected Response:**
```json
{
  "success": true,
  "profile": {
    "username": "poonam",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "profileImage": "...",
    ...
  }
}
```

---

## Testing Phase 6: Server Logs

### Check for Clean Logs
1. **Action:** Monitor `/tmp/nextjs-dev-fixed.log` or terminal
2. **Expected:**
   - ✅ No "Could not find column" errors
   - ✅ Status 200 for successful operations
   - ✅ Status 409 for duplicate usernames
   - ✅ Status 404 for non-existent profiles

### Example Clean Logs:
```
POST /api/claim-url/check 200 in 250ms
POST /api/claim-url/save 200 in 890ms
GET /poonam 200 in 350ms
GET /api/profile/poonam 200 in 180ms
```

---

## Testing Checklist Summary

### Initial Setup
- [ ] Schema cache reloaded in Supabase
- [ ] RLS policies added and verified
- [ ] Server running on http://localhost:3000
- [ ] No TypeScript/build errors

### Core Functionality
- [ ] Can access claim URL page
- [ ] Can check username availability
- [ ] Can successfully claim username
- [ ] Username stored in `custom_url` column
- [ ] Full URL stored in `profile_url` column
- [ ] Profile page accessible at claimed URL
- [ ] Duplicate usernames rejected
- [ ] Invalid formats rejected
- [ ] Valid formats accepted

### Edge Cases
- [ ] Non-existent usernames show 404
- [ ] Special characters handled correctly
- [ ] Length validation works
- [ ] Hyphen position validation works

### Performance
- [ ] Pages load in < 2 seconds
- [ ] No console errors
- [ ] CSS loads correctly
- [ ] Images load properly

---

## Common Issues and Solutions

### Issue 1: "Column not found" Error
**Solution:** Reload schema cache (see Prerequisites #1)

### Issue 2: "Failed to save username"
**Solution:**
1. Check RLS policies are added
2. Verify service role key in `.env`
3. Check database connection

### Issue 3: Profile Page Shows 404
**Solution:**
1. Verify username was saved to database
2. Check `custom_url` column has the username
3. Verify dynamic route exists: `app/[username]/page.tsx`

### Issue 4: CSS Not Loading
**Solution:**
1. Check server running on correct port (3000)
2. Verify `.env` has `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. Clear browser cache (Cmd+Shift+R)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `.env`: `NEXT_PUBLIC_SITE_URL=https://linkist.com`
- [ ] Run all tests with production URL
- [ ] Verify RLS policies are secure
- [ ] Test with real user accounts
- [ ] Check analytics/tracking
- [ ] Set up monitoring for errors
- [ ] Test on mobile devices
- [ ] Verify SEO meta tags on profile pages
- [ ] Test social sharing (Open Graph)
- [ ] Performance audit (Lighthouse)

---

## Success Criteria

✅ **Feature is working when:**
1. Users can claim custom URLs
2. Usernames are unique (no duplicates)
3. Profile pages are publicly accessible
4. URLs are stored correctly in database
5. All validation rules enforced
6. No server errors in logs
7. CSS loads perfectly
8. Mobile responsive

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Feature is production-ready
2. ✅ Document for users
3. ✅ Add to onboarding flow
4. ✅ Consider adding:
   - Username change functionality
   - Custom domains (linkist.com → yourcompany.com/poonam)
   - QR code generation for URLs
   - Analytics for profile views

---

**Ready to test?** Start with Prerequisites, then work through each phase! 🚀
