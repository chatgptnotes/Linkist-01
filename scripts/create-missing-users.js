#!/usr/bin/env node

/**
 * Script to create missing users for orphaned profiles
 *
 * This script automatically:
 * 1. Finds profiles with NULL user_id that don't have matching users
 * 2. Creates user records for them
 * 3. Links the profiles to the newly created users
 *
 * Usage: node scripts/create-missing-users.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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
  title: () => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(50)}${colors.reset}`),
  section: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
};

async function createMissingUsers() {
  try {
    log.title();
    log.section('🔧 CREATE MISSING USERS FOR ORPHANED PROFILES');
    log.title();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log.error('Missing Supabase credentials in .env file!');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    log.success('Connected to Supabase!\n');

    // Find orphaned profiles
    log.section('📋 STEP 1: Finding orphaned profiles...');

    const { data: orphanedProfiles, error: orphanError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone_number')
      .is('user_id', null);

    if (orphanError) {
      log.error(`Failed to fetch profiles: ${orphanError.message}`);
      process.exit(1);
    }

    log.info(`Found ${orphanedProfiles.length} orphaned profiles\n`);

    if (orphanedProfiles.length === 0) {
      log.success('No orphaned profiles found!');
      process.exit(0);
    }

    // Create users for orphaned profiles
    log.section('👥 STEP 2: Creating users...');

    let createdCount = 0;
    let failedCount = 0;

    for (const profile of orphanedProfiles) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', profile.email)
          .single();

        if (existingUser) {
          log.info(`User already exists for ${profile.email}, linking...`);

          // Link profile to existing user
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_id: existingUser.id })
            .eq('id', profile.id);

          if (updateError) {
            log.error(`Failed to link profile: ${updateError.message}`);
            failedCount++;
          } else {
            createdCount++;
            process.stdout.write('.');
          }
          continue;
        }

        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: profile.email,
            first_name: profile.first_name || 'User',
            last_name: profile.last_name || 'Unknown',
            phone_number: profile.phone_number,
            role: 'user',
            email_verified: false,
            mobile_verified: false
          })
          .select()
          .single();

        if (createError) {
          log.error(`Failed to create user for ${profile.email}: ${createError.message}`);
          failedCount++;
          continue;
        }

        // Link profile to new user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: newUser.id })
          .eq('id', profile.id);

        if (updateError) {
          log.error(`Created user but failed to link profile: ${updateError.message}`);
          failedCount++;
        } else {
          createdCount++;
          process.stdout.write('.');
        }
      } catch (err) {
        log.error(`Error processing ${profile.email}: ${err.message}`);
        failedCount++;
      }
    }

    console.log('\n');
    log.success(`Created/linked ${createdCount} users`);

    if (failedCount > 0) {
      log.warning(`Failed: ${failedCount}`);
    }

    // Verify final state
    log.section('\n✅ STEP 3: Verifying final state...');

    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('id, user_id');

    const finalTotal = finalProfiles.length;
    const finalNull = finalProfiles.filter((p) => !p.user_id).length;
    const finalValid = finalTotal - finalNull;

    console.log('');
    log.info(`Total profiles: ${finalTotal}`);
    log.success(`Valid user_ids: ${finalValid}`);

    if (finalNull > 0) {
      log.warning(`Still NULL: ${finalNull}`);
    } else {
      log.success('🎉 All profiles now have valid user_ids!');
    }

    const percentage = ((finalValid / finalTotal) * 100).toFixed(1);
    log.success(`Final health: ${percentage}% profiles have valid user_ids`);

    log.title();
    console.log('');

  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

createMissingUsers();
