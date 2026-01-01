import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  try {
    console.log('Connecting to Supabase...');
    console.log('URL:', supabaseUrl);

    // First, check if table exists
    console.log('\nChecking if subscription_plans table exists...');
    const { data: existingData, error: checkError } = await supabase
      .from('subscription_plans')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✓ Table already exists!');
      console.log('Current plans count:', existingData?.length || 0);

      // List all plans
      const { data: allPlans, error: listError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (!listError && allPlans) {
        console.log('\nExisting plans:');
        allPlans.forEach(plan => {
          console.log(`  - ${plan.name} (${plan.type}): $${plan.price} - ${plan.status}`);
        });
      }

      return;
    }

    console.log('Table does not exist. You need to create it via Supabase Dashboard.');
    console.log('\nGo to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/editor');
    console.log('Then click on "SQL Editor" and run the SQL from:');
    console.log('supabase/migrations/create_subscription_plans.sql');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTable();
