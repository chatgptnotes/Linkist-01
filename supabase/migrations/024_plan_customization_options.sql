-- Plan-specific Card Customization Options
-- Junction table to define which customization options are available for each subscription plan
-- For colours, also tracks which material the colour is enabled for

CREATE TABLE IF NOT EXISTS public.plan_customization_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign keys
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES card_customization_options(id) ON DELETE CASCADE,

    -- Material-specific setting (for colours, textures, and patterns; NULL for materials only)
    material_key VARCHAR(50) DEFAULT NULL,

    -- Plan-specific settings
    is_enabled BOOLEAN DEFAULT true,
    price_override DECIMAL(10, 2) DEFAULT NULL,  -- Optional price override per plan

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Unique constraint: each option can only appear once per plan per material
    -- material_key is NULL for non-colour options, so we use COALESCE
    CONSTRAINT unique_plan_option_material UNIQUE (plan_id, option_id, material_key)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_plan_customization_plan_id ON public.plan_customization_options(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_customization_option_id ON public.plan_customization_options(option_id);
CREATE INDEX IF NOT EXISTS idx_plan_customization_enabled ON public.plan_customization_options(is_enabled);

-- Enable RLS
ALTER TABLE public.plan_customization_options ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read for all plan options
CREATE POLICY "Allow public read" ON public.plan_customization_options
    FOR SELECT USING (true);

-- RLS Policy: Allow all operations with service role (admin API uses service role key)
CREATE POLICY "Allow service role full access" ON public.plan_customization_options
    FOR ALL USING (true);

-- Seed initial data: Link all enabled options to all plans with physical cards
-- (excluding digital-only plan which has no physical card)

-- Insert materials for physical-digital (Personal) plan
-- Materials don't need material_key (NULL)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    NULL AS material_key,
    CASE
        WHEN co.option_key = 'pvc' THEN true
        ELSE false
    END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'material'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert textures for each material in physical-digital (Personal) plan
-- PVC textures: matte and glossy enabled (based on applicable_materials)
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

-- Insert colours for each material in physical-digital (Personal) plan
-- PVC colours: white only
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'pvc' AS material_key,
    CASE WHEN co.option_key = 'white' THEN true ELSE false END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'colour'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Wood colours: cherry, birch
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'wood' AS material_key,
    CASE WHEN co.option_key IN ('cherry', 'birch') THEN true ELSE false END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'colour'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Metal colours: none for personal plan
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    'metal' AS material_key,
    false AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
  AND co.category = 'colour'
ON CONFLICT (plan_id, option_id, material_key) DO NOTHING;

-- Insert patterns for each material in physical-digital (Personal) plan (all enabled)
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

-- Insert materials for founders-club plan (all enabled)
INSERT INTO plan_customization_options (plan_id, option_id, material_key, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    NULL AS material_key,
    true AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'founders-club'
  AND co.category = 'material'
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

-- Insert colours for each material in founders-club plan (all enabled)
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
  AND co.category = 'colour'
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_plan_customization_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_customization_options_updated_at
    BEFORE UPDATE ON plan_customization_options
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_customization_options_updated_at();
