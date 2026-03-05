-- Add is_default column to plan_customization_options
-- Allows admin to set default selections per plan + material combo
-- Only one option per (plan_id, category, material_key) should be default (enforced at app level)

ALTER TABLE plan_customization_options
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Add index for efficient default lookups
CREATE INDEX IF NOT EXISTS idx_plan_customization_defaults
ON plan_customization_options (plan_id, is_default)
WHERE is_default = TRUE;
