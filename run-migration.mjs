import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://xtfzuynnnouvfqwugqzw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Znp1eW5ubm91dmZxd3VncXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDY1MSwiZXhwIjoyMDc1MTQ2NjUxfQ.7KEu2NJPNSnnAjOjcfK3k6BvC4t_qSNH8mL1YFnBHbs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🚀 Running preferences column migration...\n');

// Read the migration file
const migrationPath = join(__dirname, 'supabase/migrations/add_preferences_column_to_profiles.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('Migration SQL loaded from:', migrationPath);
console.log('─'.repeat(70));

// Execute the migration
try {
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    throw error;
  }

  console.log('✅ Migration executed successfully!');
  if (data) {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Manual steps to run this migration:');
  console.log('─'.repeat(70));
  console.log('1. Go to Supabase Dashboard SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new');
  console.log('\n2. Copy and paste this SQL:\n');
  console.log(migrationSQL);
  console.log('\n3. Click "Run" button');
  console.log('─'.repeat(70));
}
