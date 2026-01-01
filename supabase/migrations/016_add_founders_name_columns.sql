-- Migration: Add first_name and last_name columns to founders_requests table
-- Replaces the single full_name column with separate first_name and last_name

-- Step 1: Add new columns (with defaults for existing rows)
ALTER TABLE founders_requests
ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';

ALTER TABLE founders_requests
ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';

-- Step 2: Migrate existing data from full_name to first_name/last_name
-- Split on first space: first word = first_name, rest = last_name
UPDATE founders_requests
SET
  first_name = COALESCE(SPLIT_PART(full_name, ' ', 1), ''),
  last_name = COALESCE(
    CASE
      WHEN POSITION(' ' IN full_name) > 0
      THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
      ELSE ''
    END,
    ''
  )
WHERE full_name IS NOT NULL AND first_name = '';

-- Step 3: Make full_name nullable for backwards compatibility
ALTER TABLE founders_requests
ALTER COLUMN full_name DROP NOT NULL;

-- Step 4: Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_founders_requests_first_name ON founders_requests(first_name);
CREATE INDEX IF NOT EXISTS idx_founders_requests_last_name ON founders_requests(last_name);

-- Comments for documentation
COMMENT ON COLUMN founders_requests.first_name IS 'First name of the requester';
COMMENT ON COLUMN founders_requests.last_name IS 'Last name of the requester';
