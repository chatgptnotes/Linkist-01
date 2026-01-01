# Vercel Deployment Environment Variables Setup

Your build is failing because environment variables are not configured in Vercel. Follow these steps to set them up:

## Quick Setup Instructions

### Step 1: Go to Vercel Project Settings
1. Open your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `LINKIST_31Oct`
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Required Environment Variables

Copy and paste each variable from your local `.env` file. You need to add the following variables:

#### Critical Variables (Required for Build):
```bash
# Supabase - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xtfzuynnnouvfqwugqzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-.env>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-.env>

# Application
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Linkist NFC

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-key-from-.env>
STRIPE_SECRET_KEY=<your-stripe-secret-from-.env>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret-from-.env>
```

#### Email Configuration:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=hello@linkist.ai
SMTP_PASS=<your-smtp-password-from-.env>
EMAIL_FROM=Linkist NFC <hello@linkist.ai>
EMAIL_REPLY_TO=support@linkist.ai
```

#### Admin Configuration:
```bash
ADMIN_EMAIL=admin@linkist.ai
ADMIN_PASSWORD=<your-admin-password-from-.env>
```

#### Optional (for full functionality):
```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=<your-twilio-sid-from-.env>
TWILIO_AUTH_TOKEN=<your-twilio-token-from-.env>
TWILIO_PHONE_NUMBER=<your-twilio-phone-from-.env>
TWILIO_VERIFY_SERVICE_SID=<your-verify-sid-from-.env>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key-from-.env>

# Testing
USE_HARDCODED_OTP=true
```

### Step 3: Set Environment for All Branches
For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click on the latest failed deployment
3. Click **Redeploy** button
4. Wait for the build to complete

---

## Alternative: Using Vercel CLI

If you prefer command line, you can use Vercel CLI to set environment variables:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull your environment variables (this will fail first time)
vercel env pull

# Add environment variables from your .env file
# You'll need to add them one by one using:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... and so on for each variable
```

---

## Important Notes

⚠️ **Security:**
- Never commit your `.env` file to Git
- The `.env` file is already in `.gitignore`
- Only add environment variables through Vercel dashboard or CLI

⚠️ **NEXT_PUBLIC_SITE_URL:**
- For production: Use your actual domain (e.g., `https://linkist.ai`)
- For Vercel deployment: Use your Vercel URL (e.g., `https://linkist-31oct.vercel.app`)

⚠️ **Stripe Webhook Secret:**
- You'll need to create a new webhook endpoint in Stripe dashboard
- Point it to: `https://your-vercel-url.vercel.app/api/stripe-webhook`
- Copy the webhook secret and add it to Vercel environment variables

---

## Verification

After deployment succeeds, test these endpoints:
1. `https://your-domain.vercel.app` - Should load homepage
2. `https://your-domain.vercel.app/api/check-env` - Should show environment status

---

## Need Help?

If you encounter issues:
1. Check Vercel build logs for specific errors
2. Verify all environment variables are set correctly
3. Make sure sensitive values don't have extra spaces
4. Ensure `NEXT_PUBLIC_SITE_URL` matches your actual deployment URL
