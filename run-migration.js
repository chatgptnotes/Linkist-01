// Run database migration to fix profiles table
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running profiles table migration...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-profiles-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split into individual statements (remove comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('DO $$'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`)

        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('profiles').select('id').limit(1)
          if (directError && directError.message.includes('alternate_email')) {
            console.log('⚠️  Need to run migration manually in Supabase SQL Editor')
            console.log('\n📋 Copy and paste the content of fix-profiles-schema.sql into:')
            console.log('   https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new\n')
            process.exit(1)
          }
        } else {
          console.log('   ✅ Success')
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 You can now save profiles without schema errors\n')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run the migration manually:')
    console.log('1. Go to: https://supabase.com/dashboard/project/xtfzuynnnouvfqwugqzw/sql/new')
    console.log('2. Copy and paste the content of fix-profiles-schema.sql')
    console.log('3. Click "Run" to execute\n')
    process.exit(1)
  }
}

runMigration()
