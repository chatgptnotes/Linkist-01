-- Merge black-pvc and black-metal into a single 'black' colour option
-- Previously there were two separate Black entries for PVC and Metal materials.
-- Now there is one 'black' entry applicable to both PVC and Metal.

-- Step 1: Update plan_customization_options to point to the black-pvc row (which we'll rename to 'black')
-- Replace any references to black-metal's option_id with black-pvc's option_id
UPDATE plan_customization_options
SET option_id = (SELECT id FROM card_customization_options WHERE category = 'colour' AND option_key = 'black-pvc')
WHERE option_id = (SELECT id FROM card_customization_options WHERE category = 'colour' AND option_key = 'black-metal')
  AND NOT EXISTS (
    -- Avoid duplicate key conflicts
    SELECT 1 FROM plan_customization_options existing
    WHERE existing.plan_id = plan_customization_options.plan_id
      AND existing.option_id = (SELECT id FROM card_customization_options WHERE category = 'colour' AND option_key = 'black-pvc')
      AND existing.material_key = plan_customization_options.material_key
  );

-- Delete any remaining plan_customization_options rows that still reference black-metal (duplicates)
DELETE FROM plan_customization_options
WHERE option_id = (SELECT id FROM card_customization_options WHERE category = 'colour' AND option_key = 'black-metal');

-- Step 2: Delete the black-metal row from card_customization_options
DELETE FROM card_customization_options WHERE category = 'colour' AND option_key = 'black-metal';

-- Step 3: Rename black-pvc to black and make it applicable to both PVC and Metal
UPDATE card_customization_options
SET option_key = 'black',
    applicable_materials = ARRAY['pvc', 'metal'],
    gradient_class = 'from-gray-900 to-black',
    updated_at = TIMEZONE('utc', NOW())
WHERE category = 'colour' AND option_key = 'black-pvc';
