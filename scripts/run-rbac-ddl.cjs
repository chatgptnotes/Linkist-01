// Runs raw SQL DDL against Supabase Postgres directly
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const dbPass = process.env.SUPABASE_PASSWORD;

  // Try multiple connection methods
  const hosts = [
    { host: `aws-0-ap-southeast-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
    { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
    { host: `aws-0-ap-south-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
  ];

  let client;
  let connected = false;

  for (const h of hosts) {
    try {
      console.log(`  Trying ${h.host}...`);
      client = new Client({
        host: h.host,
        port: h.port,
        database: 'postgres',
        user: h.user,
        password: dbPass,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await client.connect();
      connected = true;
      console.log(`  ✓ Connected via ${h.host}`);
      break;
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      try { await client.end(); } catch {}
    }
  }

  if (!connected) {
    console.error('\n✗ Could not connect to any Supabase Postgres host.');
    console.log('  Please run the SQL manually in the Supabase SQL Editor.');
    process.exit(1);
  }

  try {
    console.log('Connecting to Supabase Postgres...');
    await client.connect();
    console.log('✓ Connected\n');

    // Run RBAC system SQL
    console.log('STEP 1: Running RBAC tables migration...');
    const sql1 = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260401_rbac_system.sql'), 'utf8');
    await client.query(sql1);
    console.log('✓ Tables, roles, permissions, mappings, RLS, and view created\n');

    // Run super admin setup
    console.log('STEP 2: Running super admin setup...');
    const sql2 = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260401_super_admin_setup.sql'), 'utf8');
    const result = await client.query(sql2);
    console.log('✓ Super admin user and credentials created\n');

    // Verification
    console.log('STEP 3: Verification...');
    console.log('────────────────────────────────────');

    const counts = await client.query(`
      SELECT 'roles' AS tbl, COUNT(*)::int AS rows FROM roles
      UNION ALL SELECT 'permissions', COUNT(*)::int FROM permissions
      UNION ALL SELECT 'role_permissions', COUNT(*)::int FROM role_permissions
      UNION ALL SELECT 'user_roles', COUNT(*)::int FROM user_roles
      UNION ALL SELECT 'super_admin_credentials', COUNT(*)::int FROM super_admin_credentials
    `);
    counts.rows.forEach(r => console.log(`  ${r.tbl.padEnd(28)} ${r.rows} rows`));

    const roleSummary = await client.query(`
      SELECT r.name, r.display_name, COUNT(rp.id)::int AS perms
      FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
      GROUP BY r.id ORDER BY perms DESC
    `);
    console.log('\n  Role → Permissions:');
    roleSummary.rows.forEach(r => console.log(`    ${r.display_name.padEnd(15)} ${r.perms} permissions`));

    const sa = await client.query(`
      SELECT u.email, u.role, u.status, r.display_name AS assigned_role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = 'superadmin@linkist.ai'
    `);
    if (sa.rows[0]) {
      console.log('\n  Super Admin:');
      console.log(`    Email:    ${sa.rows[0].email}`);
      console.log(`    Role:     ${sa.rows[0].role}`);
      console.log(`    Status:   ${sa.rows[0].status}`);
      console.log(`    Assigned: ${sa.rows[0].assigned_role}`);
    }

    console.log('\n════════════════════════════════════');
    console.log('✓ ALL DONE — RBAC Migration Complete');
    console.log('════════════════════════════════════');
    console.log('\n  Login URL:  /super-admin');
    console.log('  Email:      superadmin@linkist.ai');
    console.log('  Password:   SuperAdmin@2026\n');

  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    if (err.message.includes('already exists')) {
      console.log('\n  (Some objects already exist — this is OK if re-running)');
    }
  } finally {
    await client.end();
  }
}

run();
