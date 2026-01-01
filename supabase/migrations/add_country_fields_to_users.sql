-- Add country and country_code fields to existing public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Create index on country for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users USING btree (country) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.users.country IS 'User country/region (e.g., India, UAE, USA, UK)';
COMMENT ON COLUMN public.users.country_code IS 'Phone country code (e.g., +91, +971, +1, +44)';
