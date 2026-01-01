#!/bin/bash

# Script to add country fields to users table
# This script will display instructions to run the migration in Supabase

echo "🚀 Country Fields Migration"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "To add country and country_code fields to users table:"
echo ""
echo "1. Go to your Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new"
echo ""
echo "2. Copy and paste the following SQL:"
echo ""
echo "─────────────────────────────────────────────────────────────"
cat ../supabase/migrations/add_country_fields_to_users.sql
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "3. Click 'Run' to execute the migration"
echo ""
echo "✅ After running the migration, users table will have:"
echo "   - country (TEXT): User's country/region"
echo "   - country_code (TEXT): Phone country code"
echo ""
