const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Running migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_subscription_plans.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Try alternative method
        console.log('Trying alternative method...');
        const { error: altError } = await supabase.from('_migrations').insert({ sql: statement });
        if (altError) {
          console.error('Alternative method also failed:', altError);
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\nMigration completed!');

    // Verify table exists
    console.log('\nVerifying subscription_plans table...');
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('count');

    if (error) {
      console.error('Error verifying table:', error);
    } else {
      console.log('✓ Table exists and is accessible');
      console.log('Plans count:', data);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
