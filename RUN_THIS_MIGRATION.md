# 🚀 Migration Run Karne Ka Tarika

## Step 1: Supabase Dashboard Open Karo

1. Browser mein jao: https://supabase.com/dashboard
2. Apna project select karo
3. Left sidebar se **SQL Editor** pe click karo

## Step 2: SQL Copy Karo

Ye SQL copy karo:

```sql
-- Add full profile URL column to profiles table (LOCAL VERSION)
-- This will store the complete URL like http://localhost:3001/bhupendra

DO $$
BEGIN
    -- Add profile_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'profile_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_url TEXT;

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_profile_url ON public.profiles(profile_url);

        -- Add comment
        COMMENT ON COLUMN public.profiles.profile_url IS 'Complete profile URL (e.g., http://localhost:3001/bhupendra)';
    END IF;

    -- Update existing profiles with LOCAL URL
    UPDATE public.profiles
    SET profile_url = 'http://localhost:3001/' || custom_url
    WHERE custom_url IS NOT NULL
    AND (profile_url IS NULL OR profile_url = '');

END $$;
```

## Step 3: Run Karo

1. SQL Editor mein paste karo
2. **RUN** button pe click karo (ya Cmd+Enter)
3. Success message dikhna chahiye

## Step 4: Verify Karo

Is SQL se check karo ki sahi se store hua ya nahi:

```sql
SELECT
    custom_url,
    profile_url,
    first_name,
    last_name
FROM profiles
WHERE custom_url IS NOT NULL
LIMIT 10;
```

**Expected Result:**
```
custom_url    | profile_url
-------------|----------------------------------
bhupendra    | http://localhost:3001/bhupendra
amit-bala    | http://localhost:3001/amit-bala
tipu         | http://localhost:3001/tipu
```

## Step 5: Test Karo

1. Server start karo:
   ```bash
   npm run dev
   ```

2. Browser mein jao:
   ```
   http://localhost:3002/claim-url
   ```

3. Naya username claim karo (e.g., "testuser123")

4. Success message dikhega:
   ```
   Success! Your profile is now available at:
   http://localhost:3001/testuser123
   ```

5. Database check karo:
   ```sql
   SELECT custom_url, profile_url
   FROM profiles
   WHERE custom_url = 'testuser123';
   ```

## ✅ Done!

Ab har naya user jo URL claim karega, uska full URL store hoga:
- Local: `http://localhost:3001/username`
- Production (baad mein): `https://linkist.com/username`

---

**Agar koi problem ho toh dekho:** `FULL_URL_FEATURE.md`
