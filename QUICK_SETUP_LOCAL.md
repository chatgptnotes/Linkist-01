# ⚡ Quick Setup - Local URL Storage

## 1️⃣ Migration Run Karo (2 minutes)

### Copy This SQL:
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'profile_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_url TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_profile_url ON public.profiles(profile_url);
    END IF;

    UPDATE public.profiles
    SET profile_url = 'http://localhost:3001/' || custom_url
    WHERE custom_url IS NOT NULL
    AND (profile_url IS NULL OR profile_url = '');
END $$;
```

### Where to Run:
1. Open: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor**
4. Paste & Click: **RUN**

## 2️⃣ Start Server

```bash
npm run dev
```

## 3️⃣ Test Karo

```bash
# Browser open karo
http://localhost:3002/claim-url

# Username claim karo
Enter: "testuser"
Click: "Claim URL"

# Dekho message
"Your profile is now available at: http://localhost:3001/testuser"
```

## ✅ Done!

Ab system automatically **pura URL store karega**:
- Input: "bhupendra"
- Stores: "http://localhost:3001/bhupendra"

---

## 🔍 Verify Database

```sql
SELECT custom_url, profile_url
FROM profiles
WHERE custom_url IS NOT NULL
LIMIT 5;
```

Expected:
```
bhupendra → http://localhost:3001/bhupendra
amit-bala → http://localhost:3001/amit-bala
tipu      → http://localhost:3001/tipu
```

---

## 📱 Benefits

✅ Full URL stored in database
✅ Ready for NFC cards
✅ Ready for QR codes
✅ Easy sharing
✅ WhatsApp integration ready

---

## 🚀 Production Mein

Jab server pe deploy karna ho:

1. Update `.env`:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://linkist.com
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. URLs automatically change to:
   ```
   https://linkist.com/bhupendra
   ```

---

**That's it! Bas migration run karo aur test karo!** 🎉
