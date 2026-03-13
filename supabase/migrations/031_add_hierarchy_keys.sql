
-- Add texture_key and colour_key to plan_customization_options
-- to support hierarchical cascading: Plan → Material → Texture → Colour → Pattern
--
-- Current: (plan_id, option_id, material_key) — flat per material
-- New:
--   Textures:  (plan_id, option_id, material_key, NULL, NULL)
--   Colours:   (plan_id, option_id, material_key, texture_key, NULL)
--   Patterns:  (plan_id, option_id, material_key, texture_key, colour_key)

-- Add new columns
ALTER TABLE public.plan_customization_options
  ADD COLUMN IF NOT EXISTS texture_key VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS colour_key VARCHAR(50) DEFAULT NULL;

-- Drop the old unique constraint that doesn't include new keys
ALTER TABLE public.plan_customization_options
  DROP CONSTRAINT IF EXISTS unique_plan_option_material;

-- Create new unique constraint including hierarchy keys
-- Using COALESCE so NULLs are treated as a single group
ALTER TABLE public.plan_customization_options
  ADD CONSTRAINT unique_plan_option_hierarchy UNIQUE (plan_id, option_id, material_key, texture_key, colour_key);

-- Create indexes for faster hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_plan_customization_texture_key
  ON public.plan_customization_options(texture_key);
CREATE INDEX IF NOT EXISTS idx_plan_customization_colour_key
  ON public.plan_customization_options(colour_key);

-- Migrate existing colour rows:
-- Currently colours have material_key set but no texture_key.
-- We need to fan them out so each colour row gets a texture_key for every
-- texture that is enabled for the same (plan, material).
-- This preserves backward compatibility.

-- Step 1: For each existing colour row (has material_key, category='colour'),
-- create copies with each enabled texture for that plan+material.
-- We'll insert new rows and then delete the old ones.

INSERT INTO plan_customization_options (plan_id, option_id, material_key, texture_key, colour_key, is_enabled, is_default, price_override)
SELECT DISTINCT
    pco_colour.plan_id,
    pco_colour.option_id,
    pco_colour.material_key,
    pco_texture.texture_key_val,
    NULL,
    pco_colour.is_enabled,
    pco_colour.is_default,
    pco_colour.price_override
FROM plan_customization_options pco_colour
JOIN card_customization_options cco ON cco.id = pco_colour.option_id AND cco.category = 'colour'
-- Join to find textures enabled for same plan+material
CROSS JOIN LATERAL (
    SELECT cco_t.option_key AS texture_key_val
    FROM plan_customization_options pco_t
    JOIN card_customization_options cco_t ON cco_t.id = pco_t.option_id AND cco_t.category = 'texture'
    WHERE pco_t.plan_id = pco_colour.plan_id
      AND pco_t.material_key = pco_colour.material_key
      AND pco_t.is_enabled = true
      AND pco_t.texture_key IS NULL  -- only old-style texture rows
) pco_texture
WHERE pco_colour.material_key IS NOT NULL
  AND pco_colour.texture_key IS NULL  -- only migrate old-style rows
ON CONFLICT (plan_id, option_id, material_key, texture_key, colour_key) DO NOTHING;

-- Delete old colour rows that have no texture_key (replaced by new rows above)
DELETE FROM plan_customization_options
WHERE id IN (
    SELECT pco.id
    FROM plan_customization_options pco
    JOIN card_customization_options cco ON cco.id = pco.option_id AND cco.category = 'colour'
    WHERE pco.material_key IS NOT NULL
      AND pco.texture_key IS NULL
);

-- Step 2: For each existing pattern row (has material_key, category='pattern'),
-- fan out with texture_key AND colour_key for each enabled texture+colour combo.

INSERT INTO plan_customization_options (plan_id, option_id, material_key, texture_key, colour_key, is_enabled, is_default, price_override)
SELECT DISTINCT
    pco_pattern.plan_id,
    pco_pattern.option_id,
    pco_pattern.material_key,
    pco_colour.texture_key,
    cco_c.option_key AS colour_key_val,
    pco_pattern.is_enabled,
    pco_pattern.is_default,
    pco_pattern.price_override
FROM plan_customization_options pco_pattern
JOIN card_customization_options cco_p ON cco_p.id = pco_pattern.option_id AND cco_p.category = 'pattern'
-- Join to find colours enabled for same plan+material (now with texture_key set from step 1)
JOIN plan_customization_options pco_colour
    ON pco_colour.plan_id = pco_pattern.plan_id
    AND pco_colour.material_key = pco_pattern.material_key
    AND pco_colour.texture_key IS NOT NULL
    AND pco_colour.is_enabled = true
JOIN card_customization_options cco_c ON cco_c.id = pco_colour.option_id AND cco_c.category = 'colour'
WHERE pco_pattern.material_key IS NOT NULL
  AND pco_pattern.texture_key IS NULL  -- only migrate old-style rows
ON CONFLICT (plan_id, option_id, material_key, texture_key, colour_key) DO NOTHING;

-- Delete old pattern rows that have no texture_key (replaced by new rows above)
DELETE FROM plan_customization_options
WHERE id IN (
    SELECT pco.id
    FROM plan_customization_options pco
    JOIN card_customization_options cco ON cco.id = pco.option_id AND cco.category = 'pattern'
    WHERE pco.material_key IS NOT NULL
      AND pco.texture_key IS NULL
);
