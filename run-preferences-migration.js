const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'supabase/migrations/add_preferences_column_to_profiles.sql'),
  'utf8'
);

// Supabase configuration
const SUPABASE_URL = 'https://xtfzuynnnouvfqwugqzw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Znp1eW5ubm91dmZxd3VncXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDY1MSwiZXhwIjoyMDc1MTQ2NjUxfQ.7KEu2NJPNSnnAjOjcfK3k6BvC4t_qSNH8mL1YFnBHbs';

console.log('🚀 Running preferences column migration...\n');
console.log('Migration SQL:');
console.log('─'.repeat(50));
console.log(migrationSQL);
console.log('─'.repeat(50));
console.log();

// Execute the migration using Supabase REST API
fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ sql: migrationSQL })
})
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`HTTP ${response.status}: ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ Migration executed successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Alternative: Run this SQL directly in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/add_preferences_column_to_profiles.sql');
    console.log('3. Click "Run"');
  });
