#!/usr/bin/env tsx

/**
 * Migration Script: Populate custom_url for existing profiles
 *
 * This script generates and saves custom_url for all profiles that don't have one.
 * It handles duplicates by appending numbers (e.g., john-doe, john-doe-1, john-doe-2)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  custom_url: string | null;
}

/**
 * Generate a URL-safe custom_url from first and last name
 */
function generateCustomUrl(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName}-${lastName}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Fallback to email username if names are missing
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
}

/**
 * Check if a custom_url already exists in the database
 */
async function customUrlExists(customUrl: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('custom_url')
    .eq('custom_url', customUrl)
    .maybeSingle();

  return !!data;
}

/**
 * Find a unique custom_url by appending numbers if needed
 */
async function findUniqueCustomUrl(baseUrl: string): Promise<string> {
  let customUrl = baseUrl;
  let counter = 1;

  while (await customUrlExists(customUrl)) {
    customUrl = `${baseUrl}-${counter}`;
    counter++;
  }

  return customUrl;
}

/**
 * Main migration function
 */
async function migrateCustomUrls() {
  console.log('🚀 Starting custom_url and profile_url migration...\n');

  // Get base URL for profile_url generation
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://linkist.ai';
  console.log(`🌐 Using base URL: ${baseUrl}\n`);

  // Fetch all profiles without custom_url
  console.log('📊 Fetching profiles without custom_url...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, custom_url')
    .is('custom_url', null);

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles need migration. All profiles already have custom_url!');
    return;
  }

  console.log(`📋 Found ${profiles.length} profiles to migrate\n`);

  let successCount = 0;
  let errorCount = 0;

  // Process each profile
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i] as Profile;
    const progress = `[${i + 1}/${profiles.length}]`;

    try {
      // Generate base custom_url slug
      const baseSlug = generateCustomUrl(profile.first_name, profile.last_name, profile.email);

      // Find unique custom_url
      const uniqueUrl = await findUniqueCustomUrl(baseSlug);

      // Generate full profile URL
      const fullProfileUrl = `${baseUrl}/${uniqueUrl}`;

      // Update profile with both custom_url and profile_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          custom_url: uniqueUrl,
          profile_url: fullProfileUrl
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`${progress} ❌ Failed to update ${profile.email}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`${progress} ✅ ${profile.email.padEnd(35)} → ${fullProfileUrl}`);
        successCount++;
      }
    } catch (err) {
      console.error(`${progress} ❌ Error processing ${profile.email}:`, err);
      errorCount++;
    }
  }

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📋 Total: ${profiles.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with some errors.');
  }
}

// Run migration
migrateCustomUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
