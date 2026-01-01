# Custom URL Profile Feature

## Overview
This feature allows users to claim custom URLs (like `linkist.com/bhupendra`) that display their public profile page. Users can share this personalized URL as their digital business card.

## Features Implemented

### 1. URL Claiming System (`/claim-url`)
- Users can claim a unique username (3-30 characters)
- Real-time availability checking
- Username validation (letters, numbers, hyphens only)
- Intelligent suggestions when username is taken
- Auto-suggests username based on user's name

### 2. Public Profile Pages (`/[username]`)
- Dynamic routing for all claimed usernames
- Beautiful, responsive profile display

- Profile and cover images
- Bio/About section
- Save contact as vCard
- Share profile functionality
- Contact form

### 3. API Endpoints

#### Check Username Availability
```
POST /api/claim-url/check
Body: { "username": "bhupendra" }
Response: { "available": true }
```

#### Save Claimed Username
```
POST /api/claim-url/save
Body: {
  "username": "bhupendra",
  "firstName": "Bhupendra",
  "lastName": "Doe",
  "email": "bhupendra@example.com"
}
Response: { "success": true, "username": "bhupendra" }
```

#### Get Profile by Username
```
GET /api/profile/[username]
Response: {
  "success": true,
  "profile": {
    "username": "bhupendra",
    "firstName": "Bhupendra",
    "lastName": "Doe",
    "fullName": "Bhupendra Doe",
    "title": "CEO",
    "company": "Tech Co",
    "bio": "...",
    "email": "...",
    "phone": "...",
    "linkedin": "...",
    // ... other fields
  }
}
```

## Database Schema

### Required Columns in `profiles` Table

```sql
-- Core identity
custom_url TEXT UNIQUE              -- Username (e.g., "bhupendra")
first_name TEXT
last_name TEXT
full_name TEXT

-- Professional info
title TEXT
company TEXT
bio TEXT
location TEXT

-- Contact
email TEXT
phone TEXT
website TEXT

-- Images
profile_image TEXT
cover_image TEXT
photo_url TEXT                      -- Backwards compatibility

-- Social media
linkedin_url TEXT
linkedin TEXT
twitter_url TEXT
twitter TEXT
instagram_url TEXT
instagram TEXT
facebook_url TEXT
facebook TEXT
youtube_url TEXT
youtube TEXT
github_url TEXT
github TEXT

-- Metadata
user_id UUID                        -- Reference to auth.users
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration to add required columns:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration SQL directly in Supabase dashboard
```

The migration file is located at:
`supabase/migrations/ensure_profile_columns.sql`

### 2. Test the Feature

1. **Claim a URL:**
   - Navigate to `/claim-url`
   - Enter a username (e.g., "bhupendra")
   - Click "Claim URL"

2. **View Profile:**
   - Visit `http://localhost:3001/bhupendra`
   - You should see the public profile page

3. **Update Profile:**
   - Go to profile builder/dashboard
   - Update profile information
   - Changes will be reflected on public URL

## User Flow

```
1. User completes NFC card order
   ↓
2. Redirected to /claim-url
   ↓
3. User claims custom URL (e.g., "bhupendra")
   ↓
4. Username saved to database (profiles.custom_url)
   ↓
5. User redirected to /profiles/builder to complete profile
   ↓
6. Profile data saved with custom_url
   ↓
7. Public page accessible at /bhupendra
   ↓
8. Anyone can visit linkist.com/bhupendra
```

## File Structure

```
app/
├── [username]/
│   └── page.tsx                           # Dynamic profile page
├── claim-url/
│   └── page.tsx                           # URL claiming interface
└── api/
    ├── claim-url/
    │   ├── check/
    │   │   └── route.ts                   # Check availability
    │   └── save/
    │       └── route.ts                   # Save username
    └── profile/
        └── [username]/
            └── route.ts                   # Fetch profile by username

supabase/
└── migrations/
    ├── add_custom_url_to_profiles.sql     # Initial migration
    └── ensure_profile_columns.sql         # Comprehensive migration
```

## URL Guidelines

**Valid Usernames:**
- 3-30 characters
- Letters (a-z), numbers (0-9), hyphens (-) only
- Cannot start or end with hyphen
- Case-insensitive (converted to lowercase)

**Examples:**
- ✅ `bhupendra`
- ✅ `john-doe`
- ✅ `tech-founder-2025`
- ❌ `-bhupendra` (starts with hyphen)
- ❌ `bh` (too short)
- ❌ `bhupendra@123` (special characters)

## Features in Profile Page

### Contact Actions
- **Email:** Opens email client
- **Call:** Initiates phone call
- **Save Contact:** Downloads vCard file
- **Share:** Native share or copy to clipboard

### Social Media Integration
- LinkedIn
- Twitter/X
- Instagram
- Facebook
- YouTube
- GitHub
- Personal Website

### Visual Elements
- Profile picture with fallback to initial
- Optional cover image
- Responsive design
- Gradient backgrounds
- Material UI icons

## Security & Privacy

1. **Public Access:**
   - Profiles are publicly accessible by custom_url
   - No authentication required to view
   - RLS policy: `custom_url IS NOT NULL`

2. **Data Validation:**
   - Username format validation
   - Duplicate prevention (UNIQUE constraint)
   - SQL injection protection (parameterized queries)

3. **Privacy Controls:**
   - Users control what information to display
   - Optional fields can be left blank
   - Contact form requires user consent

## Customization Options

### Profile Builder Integration

To allow users to edit their profile after claiming:

```typescript
// In profile builder/dashboard
const username = localStorage.getItem('claimedUsername');

// Update profile data with custom_url
await supabase
  .from('profiles')
  .update({
    first_name: firstName,
    last_name: lastName,
    title: title,
    bio: bio,
    // ... other fields
  })
  .eq('custom_url', username);
```

### Styling Customization

The profile page uses Tailwind CSS. To customize:

1. Edit color scheme in `/[username]/page.tsx`
2. Update gradient: `bg-gradient-to-br from-gray-50 to-gray-100`
3. Change accent color: Currently uses `red-600`
4. Modify card styling: `rounded-2xl shadow-xl`

## Analytics (Future Enhancement)

Track profile views and interactions:

```typescript
// Add to profile page
const trackProfileView = async (username: string) => {
  await fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      username,
      event: 'profile_view',
      timestamp: new Date()
    })
  });
};
```

## Troubleshooting

### Profile Not Found
- Verify username is saved in database
- Check custom_url column has the correct value
- Ensure RLS policy allows public access

### Username Already Taken
- Clear localStorage: `localStorage.removeItem('claimedUsername')`
- Check database for duplicate entries
- Verify UNIQUE constraint on custom_url

### Database Errors
```sql
-- Check if custom_url column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'custom_url';

-- Check existing usernames
SELECT custom_url, first_name, last_name, email
FROM profiles
WHERE custom_url IS NOT NULL;
```

## Next Steps

1. **Run the migration** to add custom_url support
2. **Test the flow** from claim to public page
3. **Customize styling** to match your brand
4. **Add analytics** to track profile views
5. **Integrate with NFC cards** to pre-fill URLs

## Support

For issues or questions:
- Check database schema matches requirements
- Review browser console for API errors
- Verify environment variables are set
- Check Supabase RLS policies

## WhatsApp Integration

As per your `.claude/CLAUDE.md` instructions, the DoubleTick WhatsApp API is configured with:
- API Key: `key_8sc9MP6JpQ`
- Template: `emergency_location_alert`
- Variables: `{victim_location}`, `{nearby_hospital}`, `{Phone_umber}`

This can be integrated with the profile contact form to send WhatsApp notifications when someone contacts the profile owner.
