// Run all 3 RBAC migration snippets against Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('========================================');
  console.log('LINKIST NFC — RBAC Migration');
  console.log('========================================\n');

  // SNIPPET 1: Create tables, roles, permissions
  console.log('STEP 1: Creating RBAC tables...');

  // Create roles table
  let { error } = await supabase.rpc('exec_sql', { sql: '' }).catch(() => ({}));

  // Since Supabase JS doesn't support raw SQL, we use the REST API approach
  // Let's use the tables directly via supabase-js

  // Check if roles table exists by trying to query it
  const { error: rolesCheck } = await supabase.from('roles').select('id').limit(1);

  if (rolesCheck && rolesCheck.code === '42P01') {
    console.log('  Tables do not exist yet. Please run Snippet 1 SQL in Supabase SQL Editor first.');
    console.log('  File: supabase/migrations/20260401_rbac_system.sql');
    console.log('  Then re-run this script.\n');
    process.exit(1);
  }

  // Check if roles are already seeded
  const { data: existingRoles } = await supabase.from('roles').select('name');

  if (!existingRoles || existingRoles.length === 0) {
    console.log('  Seeding roles...');
    const { error: rolesErr } = await supabase.from('roles').insert([
      { name: 'super_admin', display_name: 'Super Admin', description: 'Full system control. Manages users, roles, permissions, and all settings.', is_system: true },
      { name: 'admin', display_name: 'Admin', description: 'Broad access to orders, products, customers, analytics, and settings.', is_system: true },
      { name: 'manager', display_name: 'Manager', description: 'Manages orders, customers, vouchers, founders, and views analytics.', is_system: false },
      { name: 'support', display_name: 'Support', description: 'Handles customer queries, views orders and customers. Read-only analytics.', is_system: false },
      { name: 'viewer', display_name: 'Viewer', description: 'Read-only access to orders, customers, and analytics dashboards.', is_system: false },
      { name: 'user', display_name: 'User', description: 'Regular user. Access to own profile, orders, and cards only.', is_system: true },
    ]);
    if (rolesErr) console.log('  Roles insert:', rolesErr.message);
    else console.log('  ✓ 6 roles created');
  } else {
    console.log(`  ✓ Roles already exist (${existingRoles.length} found)`);
  }

  // Seed permissions
  const { data: existingPerms } = await supabase.from('permissions').select('id').limit(1);

  if (!existingPerms || existingPerms.length === 0) {
    console.log('  Seeding permissions...');
    const allPerms = [
      { module: 'orders', action: 'create', description: 'Create new orders' },
      { module: 'orders', action: 'read', description: 'View orders list and details' },
      { module: 'orders', action: 'update', description: 'Update order status, tracking, notes' },
      { module: 'orders', action: 'delete', description: 'Delete/cancel orders' },
      { module: 'orders', action: 'manage', description: 'Full order management including fulfillment' },
      { module: 'orders', action: 'export', description: 'Export order data' },
      { module: 'products', action: 'create', description: 'Create products and plans' },
      { module: 'products', action: 'read', description: 'View products, plans, and pricing' },
      { module: 'products', action: 'update', description: 'Edit products, plans, and card options' },
      { module: 'products', action: 'delete', description: 'Delete products and plans' },
      { module: 'products', action: 'manage', description: 'Full product and plan management' },
      { module: 'customers', action: 'create', description: 'Create customer records' },
      { module: 'customers', action: 'read', description: 'View customer list and details' },
      { module: 'customers', action: 'update', description: 'Edit customer information' },
      { module: 'customers', action: 'delete', description: 'Delete customer records' },
      { module: 'customers', action: 'manage', description: 'Full customer management' },
      { module: 'customers', action: 'export', description: 'Export customer data' },
      { module: 'analytics', action: 'read', description: 'View dashboard and analytics' },
      { module: 'analytics', action: 'export', description: 'Export analytics reports' },
      { module: 'analytics', action: 'manage', description: 'Full analytics access and configuration' },
      { module: 'vouchers', action: 'create', description: 'Create voucher codes' },
      { module: 'vouchers', action: 'read', description: 'View voucher list and usage' },
      { module: 'vouchers', action: 'update', description: 'Edit voucher details and limits' },
      { module: 'vouchers', action: 'delete', description: 'Delete vouchers' },
      { module: 'vouchers', action: 'manage', description: 'Full voucher management' },
      { module: 'founders', action: 'read', description: 'View founder requests and members' },
      { module: 'founders', action: 'approve', description: 'Approve or reject founder requests' },
      { module: 'founders', action: 'manage', description: 'Full founders program management including codes' },
      { module: 'cards', action: 'create', description: 'Create card configurations' },
      { module: 'cards', action: 'read', description: 'View card designs and options' },
      { module: 'cards', action: 'update', description: 'Edit card customization options' },
      { module: 'cards', action: 'delete', description: 'Delete card configurations' },
      { module: 'cards', action: 'manage', description: 'Full card and printer management' },
      { module: 'profiles', action: 'create', description: 'Create user profiles' },
      { module: 'profiles', action: 'read', description: 'View profiles and templates' },
      { module: 'profiles', action: 'update', description: 'Edit profiles' },
      { module: 'profiles', action: 'delete', description: 'Delete profiles' },
      { module: 'profiles', action: 'manage', description: 'Full profile and template management' },
      { module: 'communications', action: 'create', description: 'Send emails and SMS' },
      { module: 'communications', action: 'read', description: 'View communication logs and templates' },
      { module: 'communications', action: 'update', description: 'Edit email templates and campaigns' },
      { module: 'communications', action: 'delete', description: 'Delete templates and campaigns' },
      { module: 'communications', action: 'manage', description: 'Full communications management' },
      { module: 'subscribers', action: 'read', description: 'View subscriber list' },
      { module: 'subscribers', action: 'manage', description: 'Manage subscribers and exports' },
      { module: 'subscribers', action: 'export', description: 'Export subscriber data' },
      { module: 'users', action: 'create', description: 'Create new user accounts' },
      { module: 'users', action: 'read', description: 'View user list and details' },
      { module: 'users', action: 'update', description: 'Edit user profiles and status' },
      { module: 'users', action: 'delete', description: 'Delete user accounts' },
      { module: 'users', action: 'manage', description: 'Full user management including role assignment' },
      { module: 'roles', action: 'create', description: 'Create new roles' },
      { module: 'roles', action: 'read', description: 'View roles and permissions' },
      { module: 'roles', action: 'update', description: 'Edit roles and assign permissions' },
      { module: 'roles', action: 'delete', description: 'Delete custom roles' },
      { module: 'roles', action: 'manage', description: 'Full RBAC management' },
      { module: 'settings', action: 'read', description: 'View system settings' },
      { module: 'settings', action: 'update', description: 'Change system settings' },
      { module: 'settings', action: 'manage', description: 'Full settings management including API keys' },
    ];

    const { error: permsErr } = await supabase.from('permissions').insert(allPerms);
    if (permsErr) console.log('  Permissions insert:', permsErr.message);
    else console.log(`  ✓ ${allPerms.length} permissions created`);
  } else {
    const { count } = await supabase.from('permissions').select('*', { count: 'exact', head: true });
    console.log(`  ✓ Permissions already exist (${count} found)`);
  }

  // Assign permissions to roles
  console.log('  Assigning permissions to roles...');

  const { data: roles } = await supabase.from('roles').select('id, name');
  const { data: perms } = await supabase.from('permissions').select('id, module, action');

  if (!roles || !perms) {
    console.log('  ✗ Could not load roles or permissions');
    process.exit(1);
  }

  const roleMap = {};
  roles.forEach(r => roleMap[r.name] = r.id);

  const findPerm = (mod, act) => perms.find(p => p.module === mod && p.action === act)?.id;

  // Check existing role_permissions
  const { count: rpCount } = await supabase.from('role_permissions').select('*', { count: 'exact', head: true });

  if (rpCount && rpCount > 0) {
    console.log(`  ✓ Role permissions already assigned (${rpCount} mappings)`);
  } else {
    const rpInserts = [];

    // Super Admin: ALL
    perms.forEach(p => rpInserts.push({ role_id: roleMap['super_admin'], permission_id: p.id }));

    // Admin: All except roles.manage, roles.delete, settings.manage
    perms.filter(p => !(p.module === 'roles' && ['manage', 'delete'].includes(p.action)) && !(p.module === 'settings' && p.action === 'manage'))
      .forEach(p => rpInserts.push({ role_id: roleMap['admin'], permission_id: p.id }));

    // Manager
    const managerModulesFull = ['orders', 'customers', 'vouchers', 'founders'];
    const managerRules = (p) =>
      managerModulesFull.includes(p.module) ||
      (p.module === 'products' && ['read', 'update'].includes(p.action)) ||
      (p.module === 'cards' && ['read', 'update'].includes(p.action)) ||
      (p.module === 'analytics' && ['read', 'export'].includes(p.action)) ||
      (p.module === 'communications' && p.action === 'read') ||
      (p.module === 'subscribers' && p.action === 'read') ||
      (p.module === 'users' && p.action === 'read');
    perms.filter(managerRules).forEach(p => rpInserts.push({ role_id: roleMap['manager'], permission_id: p.id }));

    // Support
    const supportRules = (p) =>
      (p.module === 'orders' && ['read', 'update'].includes(p.action)) ||
      (p.module === 'customers' && ['read', 'update'].includes(p.action)) ||
      (p.module === 'vouchers' && p.action === 'read') ||
      (p.module === 'founders' && p.action === 'read') ||
      (p.module === 'analytics' && p.action === 'read') ||
      (p.module === 'cards' && p.action === 'read') ||
      (p.module === 'profiles' && p.action === 'read');
    perms.filter(supportRules).forEach(p => rpInserts.push({ role_id: roleMap['support'], permission_id: p.id }));

    // Viewer: read-only on select modules
    perms.filter(p => p.action === 'read' && ['orders', 'customers', 'analytics', 'products', 'vouchers'].includes(p.module))
      .forEach(p => rpInserts.push({ role_id: roleMap['viewer'], permission_id: p.id }));

    // User: orders.read only
    const ordersRead = findPerm('orders', 'read');
    if (ordersRead) rpInserts.push({ role_id: roleMap['user'], permission_id: ordersRead });

    const { error: rpErr } = await supabase.from('role_permissions').insert(rpInserts);
    if (rpErr) console.log('  Role permissions error:', rpErr.message);
    else console.log(`  ✓ ${rpInserts.length} role-permission mappings created`);
  }

  // SNIPPET 2: Create super admin user
  console.log('\nSTEP 2: Setting up Super Admin user...');

  const bcrypt = require('bcryptjs');
  const password = 'SuperAdmin@2026';
  const hash = await bcrypt.hash(password, 12);

  // Upsert user
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', 'superadmin@linkist.ai').single();

  if (!existingUser) {
    const { error: userErr } = await supabase.from('users').insert({
      email: 'superadmin@linkist.ai',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
    });
    if (userErr) console.log('  User create error:', userErr.message);
    else console.log('  ✓ Super admin user created');
  } else {
    await supabase.from('users').update({ role: 'super_admin', status: 'active' }).eq('email', 'superadmin@linkist.ai');
    console.log('  ✓ Super admin user already exists — updated role');
  }

  // Set credentials
  const { data: existingCreds } = await supabase.from('super_admin_credentials').select('id').eq('email', 'superadmin@linkist.ai').single();

  if (!existingCreds) {
    const { error: credErr } = await supabase.from('super_admin_credentials').insert({
      email: 'superadmin@linkist.ai',
      password_hash: hash,
      display_name: 'Super Administrator',
    });
    if (credErr) console.log('  Credentials error:', credErr.message);
    else console.log('  ✓ Super admin credentials set');
  } else {
    // Update hash to ensure it matches
    await supabase.from('super_admin_credentials').update({ password_hash: hash }).eq('email', 'superadmin@linkist.ai');
    console.log('  ✓ Super admin credentials updated with fresh hash');
  }

  // Assign role
  const { data: saUser } = await supabase.from('users').select('id').eq('email', 'superadmin@linkist.ai').single();
  const saRoleId = roleMap['super_admin'];

  if (saUser && saRoleId) {
    const { error: urErr } = await supabase.from('user_roles').upsert({
      user_id: saUser.id,
      role_id: saRoleId,
    }, { onConflict: 'user_id,role_id' });
    if (urErr) console.log('  Role assign error:', urErr.message);
    else console.log('  ✓ super_admin role assigned');
  }

  // SNIPPET 3: Verification
  console.log('\nSTEP 3: Verification...');
  console.log('----------------------------------------');

  const { count: rCount } = await supabase.from('roles').select('*', { count: 'exact', head: true });
  const { count: pCount } = await supabase.from('permissions').select('*', { count: 'exact', head: true });
  const { count: rpFinal } = await supabase.from('role_permissions').select('*', { count: 'exact', head: true });
  const { count: urCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  const { count: sacCount } = await supabase.from('super_admin_credentials').select('*', { count: 'exact', head: true });

  console.log(`  roles:                    ${rCount} rows`);
  console.log(`  permissions:              ${pCount} rows`);
  console.log(`  role_permissions:         ${rpFinal} rows`);
  console.log(`  user_roles:               ${urCount} rows`);
  console.log(`  super_admin_credentials:  ${sacCount} rows`);

  // Role permission summary
  console.log('\n  Role → Permission counts:');
  for (const role of roles) {
    const { count: c } = await supabase.from('role_permissions').select('*', { count: 'exact', head: true }).eq('role_id', role.id);
    console.log(`    ${role.name.padEnd(15)} ${c} permissions`);
  }

  // Super admin verification
  const { data: saCheck } = await supabase
    .from('users')
    .select('email, role, status')
    .eq('email', 'superadmin@linkist.ai')
    .single();

  console.log('\n  Super Admin User:');
  console.log(`    Email:    ${saCheck?.email}`);
  console.log(`    Role:     ${saCheck?.role}`);
  console.log(`    Status:   ${saCheck?.status}`);

  // Verify password works
  const { data: cred } = await supabase.from('super_admin_credentials').select('password_hash').eq('email', 'superadmin@linkist.ai').single();
  const passMatch = await bcrypt.compare('SuperAdmin@2026', cred.password_hash);
  console.log(`    Password: ${passMatch ? '✓ Verified' : '✗ MISMATCH'}`);

  console.log('\n========================================');
  console.log('✓ RBAC Migration Complete!');
  console.log('========================================');
  console.log('\nLogin at: /super-admin');
  console.log('Email:    superadmin@linkist.ai');
  console.log('Password: SuperAdmin@2026');
  console.log('');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
