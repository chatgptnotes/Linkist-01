-- Plan-specific Card Customization Options
-- Junction table to define which customization options are available for each subscription plan

CREATE TABLE IF NOT EXISTS public.plan_customization_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign keys
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES card_customization_options(id) ON DELETE CASCADE,

    -- Plan-specific settings
    is_enabled BOOLEAN DEFAULT true,
    price_override DECIMAL(10, 2) DEFAULT NULL,  -- Optional price override per plan

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Unique constraint: each option can only appear once per plan
    CONSTRAINT unique_plan_option UNIQUE (plan_id, option_id)
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

-- Insert for physical-digital (Personal) plan
INSERT INTO plan_customization_options (plan_id, option_id, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    -- For Personal plan: enable basic options only (PVC, white, matte)
    CASE
        WHEN co.option_key IN ('pvc', 'white', 'matte') THEN true
        ELSE false
    END AS is_enabled
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'physical-digital'
ON CONFLICT (plan_id, option_id) DO NOTHING;

-- Insert for founders-club plan (all options enabled)
INSERT INTO plan_customization_options (plan_id, option_id, is_enabled)
SELECT
    sp.id AS plan_id,
    co.id AS option_id,
    true AS is_enabled  -- All options enabled for founders
FROM subscription_plans sp
CROSS JOIN card_customization_options co
WHERE sp.type = 'founders-club'
ON CONFLICT (plan_id, option_id) DO NOTHING;

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
