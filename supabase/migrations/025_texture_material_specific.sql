-- Migration: Add material-specific texture and pattern entries
-- This converts textures and patterns from global (NULL material_key) to per-material configuration

-- First, delete old texture entries with NULL material_key
DELETE FROM plan_customization_options
WHERE option_id IN (
    SELECT id FROM card_customization_options WHERE category = 'texture'
)
AND material_key IS NULL;

-- Insert textures for each material in physical-digital (Personal) plan
-- PVC textures: matte and glossy enabled
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'pvc' AS material_key,
    CASE WHEN co.option_key IN ('matte', 'glossy') THEN true ELSE false END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'texture'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Wood textures: natural (none) enabled
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'wood' AS material_key,
    CASE WHEN co.option_key = 'none' THEN true ELSE false END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'texture'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Metal textures: matte and brushed enabled
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'metal' AS material_key,
    CASE WHEN co.option_key IN ('matte', 'brushed') THEN true ELSE false END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'texture'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert textures for each material in founders-club plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'founders-club'
  AND co.category = 'texture'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- =============================================
-- PATTERNS: Convert from global to per-material
-- =============================================

-- Delete old pattern entries with NULL material_key
DELETE FROM plan_customization_options
WHERE option_id IN (
    SELECT id FROM card_customization_options WHERE category = 'pattern'
)
AND material_key IS NULL;

-- Insert patterns for each material in physical-digital (Personal) plan
-- All patterns enabled by default for all materials
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'physical-digital'
  AND co.category = 'pattern'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert patterns for each material in founders-club plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    m.option_key AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
CROSS JOIN card_customization_options m
WHERE sp.type = 'founders-club'
  AND co.category = 'pattern'
  AND m.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;
