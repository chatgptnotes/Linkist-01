-- Migration: Add company_name column to founders_requests table
-- Date: 2025-12-23
-- Description: Adds optional company_name field to track company information in Founders Club requests

-- Add company_name column to founders_requests table
ALTER TABLE founders_requests
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add index for searching by company name
CREATE INDEX IF NOT EXISTS idx_founders_requests_company_name
ON founders_requests(company_name);

-- Add comment for documentation
COMMENT ON COLUMN founders_requests.company_name IS 'Optional company name provided by the applicant';
