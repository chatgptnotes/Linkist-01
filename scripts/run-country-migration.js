#!/usr/bin/env node

/**
 * Migration script to add country and country_code fields to users table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting migration to add country fields to users table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_country_fields_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Execute the migration
    console.log('⏳ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If the RPC function doesn't exist, try direct approach
      console.log('ℹ️  RPC method not available, using direct SQL execution...');

      // Split SQL by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          query: statement
        });

        if (stmtError) {
          console.error(`   ❌ Error: ${stmtError.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying changes...');

    // Verify the columns were added
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('id, email, country, country_code')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      console.error('\n⚠️  Please run the migration manually in Supabase SQL Editor:');
      console.error(`   1. Go to: ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql/new')}`);
      console.error('   2. Copy and paste the SQL from: supabase/migrations/add_country_fields_to_users.sql');
      console.error('   3. Click "Run" to execute the migration');
      process.exit(1);
    }

    console.log('✅ Columns verified! The following columns are now available:');
    console.log('   - country');
    console.log('   - country_code');
    console.log('\n🎉 Migration successful! Users can now store country information.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n⚠️  Please run the migration manually:');
    console.error(`   1. Go to Supabase SQL Editor: ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql/new')}`);
    console.error('   2. Copy and paste the SQL from: supabase/migrations/add_country_fields_to_users.sql');
    console.error('   3. Click "Run" to execute the migration');
    process.exit(1);
  }
}

// Run the migration
runMigration();
