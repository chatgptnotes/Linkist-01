-- ╔══════════════════════════════════════════════════════════════╗
-- ║  LINKIST NFC — COMPLETE RBAC SETUP                         ║
-- ║  Copy this ENTIRE file → Paste in Supabase SQL Editor → Run ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, action)
);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS super_admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) DEFAULT 'Super Admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ALTER USERS TABLE ============

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'super_admin', 'moderator', 'manager', 'support', 'viewer'));

-- ============ SEED ROLES ============

INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Admin',  'Full system control. Manages users, roles, permissions, and all settings.', true),
  ('admin',       'Admin',        'Broad access to orders, products, customers, analytics, and settings.',      true),
  ('manager',     'Manager',      'Manages orders, customers, vouchers, founders, and views analytics.',        false),
  ('support',     'Support',      'Handles customer queries, views orders and customers. Read-only analytics.', false),
  ('viewer',      'Viewer',       'Read-only access to orders, customers, and analytics dashboards.',           false),
  ('user',        'User',         'Regular user. Access to own profile, orders, and cards only.',               true)
ON CONFLICT (name) DO NOTHING;

-- ============ SEED 58 PERMISSIONS ============

INSERT INTO permissions (module, action, description) VALUES
  ('orders','create','Create new orders'),('orders','read','View orders list and details'),
  ('orders','update','Update order status, tracking, notes'),('orders','delete','Delete/cancel orders'),
  ('orders','manage','Full order management including fulfillment'),('orders','export','Export order data'),
  ('products','create','Create products and plans'),('products','read','View products, plans, and pricing'),
  ('products','update','Edit products, plans, and card options'),('products','delete','Delete products and plans'),
  ('products','manage','Full product and plan management'),
  ('customers','create','Create customer records'),('customers','read','View customer list and details'),
  ('customers','update','Edit customer information'),('customers','delete','Delete customer records'),
  ('customers','manage','Full customer management'),('customers','export','Export customer data'),
  ('analytics','read','View dashboard and analytics'),('analytics','export','Export analytics reports'),
  ('analytics','manage','Full analytics access and configuration'),
  ('vouchers','create','Create voucher codes'),('vouchers','read','View voucher list and usage'),
  ('vouchers','update','Edit voucher details and limits'),('vouchers','delete','Delete vouchers'),
  ('vouchers','manage','Full voucher management'),
  ('founders','read','View founder requests and members'),('founders','approve','Approve or reject founder requests'),
  ('founders','manage','Full founders program management including codes'),
  ('analytics','read','View analytics and reports'),('analytics','export','Export analytics reports'),
  ('analytics','manage','Full analytics access'),
  ('users','create','Create new user accounts'),('users','read','View user list and details'),
  ('users','update','Edit user profiles and status'),('users','delete','Delete user accounts'),
  ('users','manage','Full user management including role assignment'),
  ('subscribers','read','View subscriber list'),('subscribers','manage','Manage subscribers and exports'),
  ('subscribers','export','Export subscriber data'),
  ('communications','create','Send emails and SMS'),('communications','read','View communication logs'),
  ('communications','update','Edit email templates and campaigns'),('communications','delete','Delete templates'),
  ('communications','manage','Full communications management'),
  ('settings','read','View system settings'),('settings','update','Change system settings'),
  ('settings','manage','Full settings management including API keys'),
  ('dashboard','read','View admin dashboard'),('dashboard','manage','Configure dashboard widgets')
ON CONFLICT (module, action) DO NOTHING;

-- ============ ASSIGN PERMISSIONS TO ROLES ============

-- Super Admin → ALL
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin → All except settings.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
  AND NOT (p.module = 'settings' AND p.action = 'manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager → Dashboard, Orders, Customers, Vouchers, Founders (full), Products (read/update), Analytics (read/export), Communications (read), Subscribers (read), Users (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'manager'
  AND (p.module IN ('orders','customers','vouchers','founders')
    OR (p.module = 'dashboard' AND p.action = 'read')
    OR (p.module = 'products' AND p.action IN ('read','update'))
    OR (p.module = 'analytics' AND p.action IN ('read','export'))
    OR (p.module = 'communications' AND p.action = 'read')
    OR (p.module = 'subscribers' AND p.action = 'read')
    OR (p.module = 'users' AND p.action = 'read'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Support → Dashboard (read), Orders (read/update), Customers (read/update), Vouchers/Founders/Analytics (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'support'
  AND ((p.module = 'dashboard' AND p.action = 'read')
    OR (p.module = 'orders' AND p.action IN ('read','update'))
    OR (p.module = 'customers' AND p.action IN ('read','update'))
    OR (p.module IN ('vouchers','founders','analytics') AND p.action = 'read'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer → read-only on Dashboard, Orders, Customers, Analytics, Products, Vouchers
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'viewer'
  AND p.action = 'read' AND p.module IN ('dashboard','orders','customers','analytics','products','vouchers')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User → orders.read only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'user'
  AND p.module = 'orders' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============ RLS ============

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_roles" ON roles FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_permissions" ON permissions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_role_permissions" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_user_roles" ON user_roles FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_super_admin_creds" ON super_admin_credentials FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPER VIEW ============

CREATE OR REPLACE VIEW user_permissions_view AS
SELECT ur.user_id, r.name AS role_name, r.display_name AS role_display_name,
       p.module, p.action, p.id AS permission_id
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id;

-- ============ SUPER ADMIN USER ============

INSERT INTO users (id, email, first_name, last_name, role, status, email_verified, mobile_verified)
VALUES ('a0000000-0000-0000-0000-000000000001', 'superadmin@linkist.ai', 'Super', 'Admin', 'super_admin', 'active', true, true)
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', status = 'active', updated_at = NOW();

-- Password: SuperAdmin@2026 (bcrypt 12 rounds)
INSERT INTO super_admin_credentials (email, password_hash, display_name)
VALUES ('superadmin@linkist.ai', '$2b$12$Q4m0V5a8eAhiCQ7DXKcLoebttMVG.uiN1XT.cexOxUF57x338.Rgu', 'Super Administrator')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2b$12$Q4m0V5a8eAhiCQ7DXKcLoebttMVG.uiN1XT.cexOxUF57x338.Rgu';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'superadmin@linkist.ai' AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============ VERIFICATION ============

SELECT '── TABLE COUNTS ──' AS info;
SELECT 'roles' AS tbl, COUNT(*)::int AS rows FROM roles
UNION ALL SELECT 'permissions', COUNT(*)::int FROM permissions
UNION ALL SELECT 'role_permissions', COUNT(*)::int FROM role_permissions
UNION ALL SELECT 'user_roles', COUNT(*)::int FROM user_roles
UNION ALL SELECT 'super_admin_credentials', COUNT(*)::int FROM super_admin_credentials;

SELECT '── ROLE PERMISSIONS ──' AS info;
SELECT r.display_name AS role, COUNT(rp.id)::int AS permissions
FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.id ORDER BY permissions DESC;

SELECT '── SUPER ADMIN ──' AS info;
SELECT u.email, u.role, u.status, r.display_name AS assigned_role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'superadmin@linkist.ai';
