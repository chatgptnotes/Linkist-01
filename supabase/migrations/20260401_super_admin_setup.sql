-- ============================================================
-- SUPER ADMIN SETUP & VERIFICATION
-- Run AFTER 20260401_rbac_system.sql
-- ============================================================

-- 1. Create super admin user (if not exists)
INSERT INTO users (id, email, first_name, last_name, role, status, email_verified, mobile_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'superadmin@linkist.ai',
  'Super',
  'Admin',
  'super_admin',
  'active',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  updated_at = NOW();

-- 2. Set super admin credentials
-- Password: SuperAdmin@2026
INSERT INTO super_admin_credentials (email, password_hash, display_name)
VALUES (
  'superadmin@linkist.ai',
  '$2b$12$Q4m0V5a8eAhiCQ7DXKcLoebttMVG.uiN1XT.cexOxUF57x338.Rgu',
  'Super Administrator'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Assign super_admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'superadmin@linkist.ai'
  AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES — Copy & run these to confirm
-- ============================================================

-- CHECK 1: All RBAC tables exist with row counts
SELECT 'roles' AS tbl, COUNT(*) AS rows FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL SELECT 'super_admin_credentials', COUNT(*) FROM super_admin_credentials;

-- CHECK 2: Roles with permission counts
SELECT
  r.name AS role,
  r.display_name,
  r.is_system,
  COUNT(rp.id) AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.id ORDER BY r.is_system DESC, permissions DESC;

-- CHECK 3: Super admin user verification
SELECT
  u.email,
  u.role AS db_role,
  u.status,
  r.display_name AS assigned_role,
  COUNT(p.id) AS total_permissions
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.email = 'superadmin@linkist.ai'
GROUP BY u.email, u.role, u.status, r.display_name;

-- CHECK 4: Full permission matrix (all roles × modules)
SELECT
  r.display_name AS role,
  p.module,
  string_agg(p.action, ', ' ORDER BY p.action) AS actions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
GROUP BY r.display_name, p.module
ORDER BY r.display_name, p.module;

-- CHECK 5: All permissions list
SELECT module, action, description
FROM permissions
ORDER BY module, action;
