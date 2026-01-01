# 📋 Quick Reference Card

## 🎯 Goal
Store custom URLs in database and make public profile pages accessible.

---

## ⚡ Quick Fix (2 Steps - 10 Minutes)

### Step 1: Reload Schema Cache
```
https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw
→ Settings → API → "Reload schema" button
```

### Step 2: Add RLS Policies
```
https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
→ SQL Editor → Copy ADD_RLS_POLICIES.sql → Run
```

**That's it! Feature will work.**

---

## 📊 What Gets Stored

| Column | Example Value | Type |
|--------|---------------|------|
| `custom_url` | `"poonam"` | TEXT (UNIQUE) |
| `profile_url` | `"http://localhost:3000/poonam"` | TEXT |

---

## 🔗 URLs

| Action | URL |
|--------|-----|
| Claim URL Page | http://localhost:3000/claim-url |
| Public Profile | http://localhost:3000/poonam |
| Profile Builder | http://localhost:3000/profiles/builder |
| API - Check | POST /api/claim-url/check |
| API - Save | POST /api/claim-url/save |
| API - Fetch | GET /api/profile/poonam |

---

## ✅ Valid Usernames

```
✅ poonam
✅ poonam-sharma
✅ poonam123
✅ abc-123-xyz

❌ ab (too short)
❌ Poonam (uppercase)
❌ poo_nam (underscore)
❌ -poonam (starts with hyphen)
❌ poonam- (ends with hyphen)
```

---

## 🧪 Quick Test

```bash
# Test 1: Check availability
curl -X POST http://localhost:3000/api/claim-url/check \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# Expected: {"available":true}

# Test 2: Claim username
curl -X POST http://localhost:3000/api/claim-url/save \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com"}'

# Expected: {"success":true,"username":"testuser","profileUrl":"http://localhost:3000/testuser"}

# Test 3: View profile
curl http://localhost:3000/api/profile/testuser

# Expected: Full profile JSON
```

---

## 📁 Important Files

| File | What It Does |
|------|--------------|
| `START_HERE.md` | Start here for setup |
| `RELOAD_SCHEMA_CACHE.md` | How to reload cache |
| `ADD_RLS_POLICIES.sql` | Database security policies |
| `COMPLETE_TESTING_GUIDE.md` | Full testing checklist |
| `SOLUTION_SUMMARY.md` | Technical deep dive |

---

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| "Column not found" | Reload schema cache |
| "Permission denied" | Add RLS policies |
| "Username taken" | Use different username |
| "Invalid format" | Check username rules |
| Page 404 | Verify username in DB |

---

## 🚀 Production

```bash
# Update .env
NEXT_PUBLIC_SITE_URL=https://linkist.com

# URLs will become
profile_url: "https://linkist.com/poonam"
```

---

## 📞 Quick Links

- Supabase Dashboard: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw
- SQL Editor: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
- Table Editor: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor
- API Settings: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/settings/api

---

## ✨ Success Checklist

- [ ] Schema cache reloaded
- [ ] RLS policies added
- [ ] Can claim username
- [ ] Database stores data
- [ ] Profile page loads
- [ ] No server errors
- [ ] Duplicates rejected

**7/7 = Feature Working! 🎉**

---

**Read This First:** `START_HERE.md`
**Total Time:** 20 minutes
