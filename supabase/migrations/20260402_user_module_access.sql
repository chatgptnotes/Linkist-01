-- Migration: Per-user module access for admin panel
-- Each row grants a user visibility to one admin module

CREATE TABLE IF NOT EXISTS user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_user_module_access_user ON user_module_access(user_id);

-- Add read:roles as a distinct permission (currently aliased to read:users)
INSERT INTO permissions (module, action, description) VALUES
  ('roles', 'read', 'View roles and permissions page'),
  ('roles', 'manage', 'Manage roles and permissions')
ON CONFLICT (module, action) DO NOTHING;

-- Grant read:roles to super_admin and admin roles
DO $$
DECLARE
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_perm_read_id UUID;
  v_perm_manage_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO v_admin_id FROM roles WHERE name = 'admin';
  SELECT id INTO v_perm_read_id FROM permissions WHERE module = 'roles' AND action = 'read';
  SELECT id INTO v_perm_manage_id FROM permissions WHERE module = 'roles' AND action = 'manage';

  IF v_super_admin_id IS NOT NULL AND v_perm_read_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id) VALUES (v_super_admin_id, v_perm_read_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_super_admin_id IS NOT NULL AND v_perm_manage_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id) VALUES (v_super_admin_id, v_perm_manage_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_admin_id IS NOT NULL AND v_perm_read_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id) VALUES (v_admin_id, v_perm_read_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- RLS
ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on user_module_access"
  ON user_module_access FOR ALL
  USING (true) WITH CHECK (true);
