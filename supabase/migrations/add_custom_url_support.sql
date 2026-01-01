-- Add custom URL support to profiles table
-- This migration matches the existing schema structure

DO $$
BEGIN
    -- The custom_url column should already exist based on your schema
    -- But let's ensure it has the unique constraint and index

    -- Create unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_custom_url_key'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_custom_url_key UNIQUE (custom_url);
    END IF;

    -- Create index if it doesn't exist (likely already exists)
    CREATE INDEX IF NOT EXISTS idx_profiles_custom_url
    ON public.profiles USING btree (custom_url);

    -- Add comment for documentation
    COMMENT ON COLUMN public.profiles.custom_url IS
    'Unique URL slug for public profile (e.g., linkist.com/username)';

END $$;

-- Create or replace policy for public profile viewing
DROP POLICY IF EXISTS "Allow public to view profiles by custom_url" ON public.profiles;

CREATE POLICY "Allow public to view profiles by custom_url"
    ON public.profiles
    FOR SELECT
    USING (custom_url IS NOT NULL);

-- Helpful comments for the fields we're using
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.job_title IS 'Professional title/position';
COMMENT ON COLUMN public.profiles.company_name IS 'Company name';
COMMENT ON COLUMN public.profiles.professional_summary IS 'Biography/about section';
COMMENT ON COLUMN public.profiles.profile_photo_url IS 'Profile picture URL';
COMMENT ON COLUMN public.profiles.background_image_url IS 'Cover/header image URL';
COMMENT ON COLUMN public.profiles.social_links IS 'Social media links stored as JSONB {"linkedin": "url", "twitter": "url", etc.}';
COMMENT ON COLUMN public.profiles.primary_email IS 'Primary contact email';
COMMENT ON COLUMN public.profiles.mobile_number IS 'Mobile phone number';
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'WhatsApp number';
COMMENT ON COLUMN public.profiles.company_website IS 'Company or personal website';
COMMENT ON COLUMN public.profiles.company_address IS 'Company address/location';

-- Create a function to validate custom_url format
CREATE OR REPLACE FUNCTION validate_custom_url()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if custom_url is being set
    IF NEW.custom_url IS NOT NULL THEN
        -- Validate format: 3-30 chars, lowercase letters, numbers, hyphens only
        IF NOT (NEW.custom_url ~ '^[a-z0-9-]{3,30}$') THEN
            RAISE EXCEPTION 'Invalid custom_url format. Must be 3-30 characters, lowercase letters, numbers, and hyphens only.';
        END IF;

        -- Cannot start or end with hyphen
        IF NEW.custom_url ~ '^-' OR NEW.custom_url ~ '-$' THEN
            RAISE EXCEPTION 'custom_url cannot start or end with a hyphen.';
        END IF;

        -- Force lowercase
        NEW.custom_url := LOWER(NEW.custom_url);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom_url validation
DROP TRIGGER IF EXISTS validate_custom_url_trigger ON public.profiles;

CREATE TRIGGER validate_custom_url_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_custom_url();

-- Create view for public profiles (optional, for easier querying)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    custom_url,
    first_name,
    last_name,
    job_title,
    company_name,
    professional_summary,
    profile_photo_url,
    background_image_url,
    primary_email,
    mobile_number,
    company_website,
    company_address,
    social_links,
    created_at
FROM public.profiles
WHERE custom_url IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;
