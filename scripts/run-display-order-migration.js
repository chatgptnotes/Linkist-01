import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting display_order migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '../supabase/migrations/20251030_add_display_order.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL loaded');
    console.log('─'.repeat(60));

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // If exec_sql doesn't exist, try direct query
        console.log('Note: exec_sql RPC not found, trying direct execution via raw SQL...');

        // For Supabase, we need to use the SQL Editor or REST API
        // Let's try a different approach - execute via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement + ';' })
        });

        if (!response.ok) {
          console.log(`⚠️  Could not execute via RPC. Statement: ${statement.substring(0, 100)}...`);
          console.log('Please run this migration manually in Supabase SQL Editor.\n');
          continue;
        }
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n🎉 Migration completed!\n');
    console.log('Next steps:');
    console.log('1. Verify the migration in Supabase dashboard');
    console.log('2. Check the subscription_plans table for the display_order column');
    console.log('3. Update existing plans with proper display_order values\n');

    // Verify the migration worked
    console.log('🔍 Verifying migration...\n');
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      console.log('⚠️  Could not verify migration automatically.');
      console.log('Please check Supabase dashboard manually.\n');
      console.log('Migration SQL has been saved to:');
      console.log(migrationPath);
      console.log('\nYou can run it manually in the Supabase SQL Editor.');
    } else {
      console.log('✅ Migration verified! Current plans:');
      console.log('─'.repeat(60));
      console.table(data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease run the migration manually in Supabase SQL Editor:');
    console.error('File location: supabase/migrations/20251030_add_display_order.sql');
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
