-- Replace old roles with new admin roles
-- Keep: super_admin, admin, user
-- Remove: manager, support, viewer
-- Add: operations_admin, customer_support_admin, finance_admin, marketing_admin, product_tech_admin, fulfilment_admin

-- Delete old roles (only if no users assigned)
DELETE FROM roles WHERE name IN ('manager', 'support', 'viewer')
  AND id NOT IN (SELECT DISTINCT role_id FROM user_roles);

-- Insert new roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('operations_admin', 'Operations Admin', 'Manages orders, fulfilment, and operational workflows', true),
  ('customer_support_admin', 'Customer Support Admin', 'Handles customer queries, orders, and support tickets', true),
  ('finance_admin', 'Finance Admin', 'Manages payments, revenue analytics, and financial reports', true),
  ('marketing_admin', 'Marketing Admin', 'Manages campaigns, communications, and subscribers', true),
  ('product_tech_admin', 'Product / Tech Admin', 'Manages products, settings, and technical configuration', true),
  ('fulfilment_admin', 'Fulfilment / Logistics Admin', 'Manages shipping, printing orders, and fulfilment', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Update users.role CHECK constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('user', 'admin', 'super_admin', 'operations_admin', 'customer_support_admin', 'finance_admin', 'marketing_admin', 'product_tech_admin', 'fulfilment_admin', 'manager', 'support', 'viewer', 'moderator')
);
