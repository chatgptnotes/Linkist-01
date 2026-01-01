#!/bin/bash

# Setup Custom URL Feature
# This script helps set up the custom URL profile feature for Linkist

echo "🚀 Setting up Custom URL Profile Feature..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking database connection...${NC}"

# Check if Supabase credentials are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  Supabase credentials not found in environment${NC}"
    echo "Please ensure .env file exists with:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
fi

echo -e "${BLUE}Step 2: Database Migration${NC}"
echo "You need to run the migration file to add custom_url support."
echo ""
echo "Option 1: Using Supabase CLI"
echo "  $ supabase db push"
echo ""
echo "Option 2: Manual SQL execution"
echo "  1. Go to Supabase Dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Run: supabase/migrations/ensure_profile_columns.sql"
echo ""

read -p "Have you run the database migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please run the migration first, then run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database migration confirmed${NC}"
echo ""

echo -e "${BLUE}Step 3: Testing the feature${NC}"
echo ""
echo "The following pages should now work:"
echo "  • /claim-url - Claim a custom username"
echo "  • /[username] - View public profile by username"
echo ""
echo "API endpoints available:"
echo "  • POST /api/claim-url/check - Check username availability"
echo "  • POST /api/claim-url/save - Save claimed username"
echo "  • GET /api/profile/[username] - Fetch profile by username"
echo ""

echo -e "${BLUE}Step 4: Quick test${NC}"
echo "Try accessing these URLs:"
echo "  1. http://localhost:3001/claim-url"
echo "  2. Claim a username (e.g., 'testuser')"
echo "  3. Visit http://localhost:3001/testuser"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📖 For detailed documentation, see:"
echo "   CUSTOM_URL_FEATURE.md"
echo ""
echo "🎯 Next steps:"
echo "   1. Start your dev server: npm run dev"
echo "   2. Navigate to /claim-url"
echo "   3. Claim your first username"
echo "   4. View your profile at /[username]"
echo ""
echo "💡 Pro tip: Check the browser console and network tab for debugging"
echo ""

# Make the script executable
chmod +x "$0"

echo "Happy building! 🎉"
