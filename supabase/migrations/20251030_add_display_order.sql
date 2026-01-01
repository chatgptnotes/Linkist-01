-- Add display_order column to subscription_plans table for controlling card ordering
-- This allows admin to set exact position (1, 2, 3) for each plan

-- Add the column
ALTER TABLE subscription_plans
ADD COLUMN display_order INTEGER DEFAULT 999;

-- Set initial display_order values for existing plans using a CTE
-- Order by price to maintain current behavior initially
WITH numbered_plans AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY price ASC) as row_num
  FROM subscription_plans
)
UPDATE subscription_plans
SET display_order = numbered_plans.row_num
FROM numbered_plans
WHERE subscription_plans.id = numbered_plans.id;

-- Make display_order NOT NULL after setting initial values
ALTER TABLE subscription_plans
ALTER COLUMN display_order SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON subscription_plans(display_order);

-- Add unique constraint to prevent duplicate positions
ALTER TABLE subscription_plans
ADD CONSTRAINT unique_display_order UNIQUE (display_order);

-- Add comment
COMMENT ON COLUMN subscription_plans.display_order IS 'Controls the display position of subscription cards (1=first, 2=second, 3=third, etc.)';
