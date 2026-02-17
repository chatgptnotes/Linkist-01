-- Seed card customization options for the Signature plan
-- All materials, textures, colours, and patterns enabled (same as Founders Circle)

-- Insert materials for signature plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    NULL AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'signature'
  AND co.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert textures for each material in signature plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'signature'
  AND co.category = 'texture'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert colours for each material in signature plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'signature'
  AND co.category = 'colour'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert patterns for each material in signature plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'signature'
  AND co.category = 'pattern'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;
