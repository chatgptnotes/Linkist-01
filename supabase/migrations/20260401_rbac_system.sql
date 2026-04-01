-- ============================================================
-- LINKIST NFC — RBAC System Migration
-- Modules: orders, products, customers, analytics, vouchers,
--          founders, cards, profiles, communications,
--          subscribers, settings, users, roles
-- ============================================================

-- 1. ROLES TABLE
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

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, action)
);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- 3. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);

-- 4. USER_ROLES
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

-- 5. SUPER ADMIN CREDENTIALS (separate login)
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

-- 6. EXPAND users.role CHECK CONSTRAINT
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'super_admin', 'moderator', 'manager', 'support', 'viewer'));

-- ============================================================
-- SEED ROLES
-- ============================================================
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Admin',  'Full system control. Manages users, roles, permissions, and all settings.', true),
  ('admin',       'Admin',        'Broad access to orders, products, customers, analytics, and settings.',      true),
  ('manager',     'Manager',      'Manages orders, customers, vouchers, founders, and views analytics.',        false),
  ('support',     'Support',      'Handles customer queries, views orders and customers. Read-only analytics.', false),
  ('viewer',      'Viewer',       'Read-only access to orders, customers, and analytics dashboards.',           false),
  ('user',        'User',         'Regular user. Access to own profile, orders, and cards only.',               true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED PERMISSIONS — matching actual Linkist modules
-- ============================================================

-- ORDERS module (order management, status updates, fulfillment)
INSERT INTO permissions (module, action, description) VALUES
  ('orders', 'create',  'Create new orders'),
  ('orders', 'read',    'View orders list and details'),
  ('orders', 'update',  'Update order status, tracking, notes'),
  ('orders', 'delete',  'Delete/cancel orders'),
  ('orders', 'manage',  'Full order management including fulfillment'),
  ('orders', 'export',  'Export order data')
ON CONFLICT (module, action) DO NOTHING;

-- PRODUCTS module (products, plans, card customization options)
INSERT INTO permissions (module, action, description) VALUES
  ('products', 'create',  'Create products and plans'),
  ('products', 'read',    'View products, plans, and pricing'),
  ('products', 'update',  'Edit products, plans, and card options'),
  ('products', 'delete',  'Delete products and plans'),
  ('products', 'manage',  'Full product and plan management')
ON CONFLICT (module, action) DO NOTHING;

-- CUSTOMERS module (customer list, details, referrals)
INSERT INTO permissions (module, action, description) VALUES
  ('customers', 'create',  'Create customer records'),
  ('customers', 'read',    'View customer list and details'),
  ('customers', 'update',  'Edit customer information'),
  ('customers', 'delete',  'Delete customer records'),
  ('customers', 'manage',  'Full customer management'),
  ('customers', 'export',  'Export customer data')
ON CONFLICT (module, action) DO NOTHING;

-- ANALYTICS module (dashboard, charts, reports, stats)
INSERT INTO permissions (module, action, description) VALUES
  ('analytics', 'read',    'View dashboard and analytics'),
  ('analytics', 'export',  'Export analytics reports'),
  ('analytics', 'manage',  'Full analytics access and configuration')
ON CONFLICT (module, action) DO NOTHING;

-- VOUCHERS module (promo codes, discounts)
INSERT INTO permissions (module, action, description) VALUES
  ('vouchers', 'create',  'Create voucher codes'),
  ('vouchers', 'read',    'View voucher list and usage'),
  ('vouchers', 'update',  'Edit voucher details and limits'),
  ('vouchers', 'delete',  'Delete vouchers'),
  ('vouchers', 'manage',  'Full voucher management')
ON CONFLICT (module, action) DO NOTHING;

-- FOUNDERS module (founding member requests, approvals, codes)
INSERT INTO permissions (module, action, description) VALUES
  ('founders', 'read',     'View founder requests and members'),
  ('founders', 'approve',  'Approve or reject founder requests'),
  ('founders', 'manage',   'Full founders program management including codes')
ON CONFLICT (module, action) DO NOTHING;

-- CARDS module (NFC card config, customization, printer)
INSERT INTO permissions (module, action, description) VALUES
  ('cards', 'create',  'Create card configurations'),
  ('cards', 'read',    'View card designs and options'),
  ('cards', 'update',  'Edit card customization options'),
  ('cards', 'delete',  'Delete card configurations'),
  ('cards', 'manage',  'Full card and printer management')
ON CONFLICT (module, action) DO NOTHING;

-- PROFILES module (digital profiles, templates, analytics)
INSERT INTO permissions (module, action, description) VALUES
  ('profiles', 'create',  'Create user profiles'),
  ('profiles', 'read',    'View profiles and templates'),
  ('profiles', 'update',  'Edit profiles'),
  ('profiles', 'delete',  'Delete profiles'),
  ('profiles', 'manage',  'Full profile and template management')
ON CONFLICT (module, action) DO NOTHING;

-- COMMUNICATIONS module (emails, SMS, campaigns, templates)
INSERT INTO permissions (module, action, description) VALUES
  ('communications', 'create',  'Send emails and SMS'),
  ('communications', 'read',    'View communication logs and templates'),
  ('communications', 'update',  'Edit email templates and campaigns'),
  ('communications', 'delete',  'Delete templates and campaigns'),
  ('communications', 'manage',  'Full communications management')
ON CONFLICT (module, action) DO NOTHING;

-- SUBSCRIBERS module (newsletter subscribers)
INSERT INTO permissions (module, action, description) VALUES
  ('subscribers', 'read',    'View subscriber list'),
  ('subscribers', 'manage',  'Manage subscribers and exports'),
  ('subscribers', 'export',  'Export subscriber data')
ON CONFLICT (module, action) DO NOTHING;

-- USERS module (user accounts, activation, suspension)
INSERT INTO permissions (module, action, description) VALUES
  ('users', 'create',  'Create new user accounts'),
  ('users', 'read',    'View user list and details'),
  ('users', 'update',  'Edit user profiles and status'),
  ('users', 'delete',  'Delete user accounts'),
  ('users', 'manage',  'Full user management including role assignment')
ON CONFLICT (module, action) DO NOTHING;

-- ROLES module (role and permission management)
INSERT INTO permissions (module, action, description) VALUES
  ('roles', 'create',  'Create new roles'),
  ('roles', 'read',    'View roles and permissions'),
  ('roles', 'update',  'Edit roles and assign permissions'),
  ('roles', 'delete',  'Delete custom roles'),
  ('roles', 'manage',  'Full RBAC management')
ON CONFLICT (module, action) DO NOTHING;

-- SETTINGS module (system settings, payments, printer, shipping)
INSERT INTO permissions (module, action, description) VALUES
  ('settings', 'read',    'View system settings'),
  ('settings', 'update',  'Change system settings'),
  ('settings', 'manage',  'Full settings management including API keys')
ON CONFLICT (module, action) DO NOTHING;

-- ============================================================
-- ASSIGN DEFAULT PERMISSIONS TO ROLES
-- ============================================================

-- SUPER ADMIN → ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN → All except roles.manage, roles.delete, settings.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
  AND NOT (p.module = 'roles' AND p.action IN ('manage', 'delete'))
  AND NOT (p.module = 'settings' AND p.action = 'manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MANAGER → Orders (all), Customers (all), Vouchers (all), Founders (all),
--           Products (read/update), Cards (read/update), Analytics (read/export),
--           Communications (read), Subscribers (read), Users (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'manager'
  AND (
    p.module = 'orders'
    OR p.module = 'customers'
    OR p.module = 'vouchers'
    OR p.module = 'founders'
    OR (p.module = 'products' AND p.action IN ('read', 'update'))
    OR (p.module = 'cards' AND p.action IN ('read', 'update'))
    OR (p.module = 'analytics' AND p.action IN ('read', 'export'))
    OR (p.module = 'communications' AND p.action = 'read')
    OR (p.module = 'subscribers' AND p.action = 'read')
    OR (p.module = 'users' AND p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SUPPORT → Orders (read/update), Customers (read/update),
--           Vouchers (read), Founders (read), Analytics (read),
--           Cards (read), Profiles (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'support'
  AND (
    (p.module = 'orders' AND p.action IN ('read', 'update'))
    OR (p.module = 'customers' AND p.action IN ('read', 'update'))
    OR (p.module = 'vouchers' AND p.action = 'read')
    OR (p.module = 'founders' AND p.action = 'read')
    OR (p.module = 'analytics' AND p.action = 'read')
    OR (p.module = 'cards' AND p.action = 'read')
    OR (p.module = 'profiles' AND p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- VIEWER → Read-only on orders, customers, analytics, products
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
  AND p.module IN ('orders', 'customers', 'analytics', 'products', 'vouchers')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- USER → orders.read only (own orders)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.module = 'orders' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on roles" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on permissions" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on role_permissions" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_roles" ON user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on super_admin_credentials" ON super_admin_credentials FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HELPER VIEW: denormalized user permissions
-- ============================================================
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT
  ur.user_id,
  r.name AS role_name,
  r.display_name AS role_display_name,
  p.module,
  p.action,
  p.id AS permission_id
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id;
