import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response;
}

async function setupDatabase() {
  try {
    console.log('Setting up database...\n');

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/create_subscription_plans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Creating subscription_plans table via REST API...');

    // Try using Supabase Management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });

    console.log('\n⚠️  Cannot create table via REST API.');
    console.log('\nPlease follow these steps to create the table:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new');
    console.log('2. Copy and paste the entire contents of:');
    console.log('   supabase/migrations/create_subscription_plans.sql');
    console.log('3. Click "Run" button');
    console.log('\nOr run this SQL directly:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('\nError:', error.message);
    console.log('\n⚠️  Please create the table manually via Supabase Dashboard.');
    console.log('\nSteps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "+ New query"');
    console.log('4. Copy the contents of: supabase/migrations/create_subscription_plans.sql');
    console.log('5. Paste and click "Run"');
  }
}

setupDatabase();
