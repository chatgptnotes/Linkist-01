#!/usr/bin/env node

/**
 * Script to fix NULL user_ids in profiles table
 *
 * This script automatically:
 * 1. Connects to Supabase
 * 2. Finds profiles with NULL user_ids
 * 3. Matches them with users by email
 * 4. Updates the user_id field
 * 5. Shows before/after stats
 *
 * Usage: node scripts/fix-null-user-ids.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(50)}${colors.reset}`),
  section: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
};

async function fixNullUserIds() {
  try {
    log.title();
    log.section('🔧 FIX NULL USER_IDS IN PROFILES TABLE');
    log.title();

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log.error('Missing Supabase credentials in .env file!');
      log.info('Required variables:');
      log.info('  - NEXT_PUBLIC_SUPABASE_URL');
      log.info('  - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    log.info('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    log.success('Connected to Supabase!\n');

    // ========================================
    // STEP 1: Get current state
    // ========================================
    log.section('📊 STEP 1: Checking current state...');

    const { data: allProfiles, error: countError } = await supabase
      .from('profiles')
      .select('id, user_id, email', { count: 'exact' });

    if (countError) {
      log.error(`Failed to fetch profiles: ${countError.message}`);
      process.exit(1);
    }

    const totalCount = allProfiles.length;
    const nullCount = allProfiles.filter((p) => !p.user_id).length;
    const validCount = totalCount - nullCount;

    console.log('');
    log.info(`Total profiles: ${totalCount}`);
    log.warning(`NULL user_ids: ${nullCount}`);
    log.success(`Valid user_ids: ${validCount}`);
    console.log('');

    if (nullCount === 0) {
      log.success('All profiles already have user_ids! Nothing to fix.');
      log.title();
      process.exit(0);
    }

    // ========================================
    // STEP 2: Get profiles with NULL user_ids
    // ========================================
    log.section('📋 STEP 2: Finding profiles with NULL user_ids...');

    const { data: nullProfiles, error: nullError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .is('user_id', null);

    if (nullError) {
      log.error(`Failed to fetch NULL profiles: ${nullError.message}`);
      process.exit(1);
    }

    log.info(`Found ${nullProfiles.length} profiles to fix\n`);

    // ========================================
    // STEP 3: Match profiles with users and update
    // ========================================
    log.section('🔄 STEP 3: Matching profiles with users...');

    let updatedCount = 0;
    let failedCount = 0;
    const orphanedProfiles = [];

    for (const profile of nullProfiles) {
      try {
        // Find user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', profile.email)
          .single();

        if (userError || !user) {
          log.warning(`No user found for email: ${profile.email}`);
          orphanedProfiles.push(profile);
          failedCount++;
          continue;
        }

        // Update profile with user_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: user.id })
          .eq('id', profile.id);

        if (updateError) {
          log.error(`Failed to update profile ${profile.email}: ${updateError.message}`);
          failedCount++;
        } else {
          updatedCount++;
          process.stdout.write('.');
        }
      } catch (err) {
        log.error(`Error processing profile ${profile.email}: ${err.message}`);
        failedCount++;
      }
    }

    console.log('\n');
    log.success(`Updated ${updatedCount} profiles`);

    if (failedCount > 0) {
      log.warning(`Failed to update ${failedCount} profiles`);
    }

    console.log('');

    // ========================================
    // STEP 4: Show orphaned profiles
    // ========================================
    if (orphanedProfiles.length > 0) {
      log.section('⚠️  STEP 4: Orphaned Profiles (No matching user):');
      console.log('');

      orphanedProfiles.forEach((profile) => {
        log.warning(`Email: ${profile.email} | Name: ${profile.first_name} ${profile.last_name}`);
      });

      console.log('');
      log.info('These profiles need users to be created first.');
      log.info('You can create users manually or delete these profiles.');
      console.log('');
    }

    // ========================================
    // STEP 5: Verify final state
    // ========================================
    log.section('✅ STEP 5: Verifying final state...');

    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, user_id');

    if (finalError) {
      log.error(`Failed to verify: ${finalError.message}`);
      process.exit(1);
    }

    const finalTotal = finalProfiles.length;
    const finalNull = finalProfiles.filter((p) => !p.user_id).length;
    const finalValid = finalTotal - finalNull;

    console.log('');
    log.info(`Total profiles: ${finalTotal}`);
    log.success(`Fixed (valid user_ids): ${finalValid}`);

    if (finalNull > 0) {
      log.warning(`Still NULL: ${finalNull}`);
    } else {
      log.success(`Still NULL: 0`);
      console.log('');
      log.success('🎉 SUCCESS: All profiles now have valid user_ids!');
    }

    // ========================================
    // Summary
    // ========================================
    log.title();
    log.section('📊 SUMMARY');
    log.title();
    console.log('');
    log.info(`Profiles processed: ${nullProfiles.length}`);
    log.success(`Successfully updated: ${updatedCount}`);

    if (failedCount > 0) {
      log.warning(`Failed: ${failedCount}`);
    }

    if (orphanedProfiles.length > 0) {
      log.warning(`Orphaned (no matching user): ${orphanedProfiles.length}`);
    }

    const percentage = ((finalValid / finalTotal) * 100).toFixed(1);
    console.log('');
    log.success(`Final health: ${percentage}% profiles have valid user_ids`);
    log.title();
    console.log('');

    if (finalNull === 0) {
      log.success('✨ All done! Your profiles table is now healthy.');
    } else {
      log.warning('⚠️  Some profiles still need attention (see orphaned list above).');
    }

    console.log('');
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
fixNullUserIds();
