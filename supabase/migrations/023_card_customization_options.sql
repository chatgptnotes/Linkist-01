-- Card Customization Options Table
-- Stores all customization options (materials, textures, colors, patterns) with enabled/disabled states

CREATE TABLE IF NOT EXISTS public.card_customization_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Option categorization
    category TEXT NOT NULL CHECK (category IN ('material', 'texture', 'colour', 'pattern')),
    option_key TEXT NOT NULL,

    -- Display properties
    label TEXT NOT NULL,
    description TEXT,

    -- For colors - visual properties
    hex_color TEXT,
    gradient_class TEXT,

    -- Pricing (only for materials)
    price DECIMAL(10, 2),

    -- Material mapping (for textures and colours)
    applicable_materials TEXT[],

    -- Status
    is_enabled BOOLEAN DEFAULT true,
    is_founders_only BOOLEAN DEFAULT false,

    -- Display ordering
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Unique constraint for category + key combination
    CONSTRAINT unique_category_key UNIQUE (category, option_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_card_customization_category ON public.card_customization_options(category);
CREATE INDEX IF NOT EXISTS idx_card_customization_enabled ON public.card_customization_options(is_enabled);
CREATE INDEX IF NOT EXISTS idx_card_customization_display_order ON public.card_customization_options(display_order);

-- Enable RLS
ALTER TABLE public.card_customization_options ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read for all options (admin check happens in API)
CREATE POLICY "Allow public read" ON public.card_customization_options
    FOR SELECT USING (true);

-- RLS Policy: Allow all operations with service role (admin API uses service role key)
CREATE POLICY "Allow service role full access" ON public.card_customization_options
    FOR ALL USING (true);

-- Insert default materials
INSERT INTO card_customization_options (category, option_key, label, description, price, display_order, is_enabled) VALUES
('material', 'pvc', 'PVC', 'Lightweight and affordable', 69.00, 1, true),
('material', 'wood', 'Wood', 'Natural and sustainable', 79.00, 2, true),
('material', 'metal', 'Metal', 'Premium and durable', 99.00, 3, true)
ON CONFLICT (category, option_key) DO NOTHING;

-- Insert default textures with material mappings
INSERT INTO card_customization_options (category, option_key, label, description, applicable_materials, display_order, is_enabled) VALUES
('texture', 'matte', 'Matte', 'Soft anti-reflective finish', ARRAY['pvc', 'metal'], 1, true),
('texture', 'glossy', 'Glossy', 'High-shine reflective surface', ARRAY['pvc'], 2, true),
('texture', 'brushed', 'Brushed', 'Directional brushed pattern', ARRAY['metal'], 3, true),
('texture', 'none', 'Natural', 'Natural material texture', ARRAY['wood'], 4, true)
ON CONFLICT (category, option_key) DO NOTHING;

-- Insert default colours with material mappings
INSERT INTO card_customization_options (category, option_key, label, hex_color, gradient_class, applicable_materials, is_founders_only, display_order, is_enabled) VALUES
('colour', 'white', 'White', '#FFFFFF', 'from-white to-gray-100', ARRAY['pvc'], false, 1, true),
('colour', 'black', 'Black', '#1A1A1A', 'from-gray-900 to-black', ARRAY['pvc', 'metal'], true, 2, true),
('colour', 'cherry', 'Cherry', '#8E3A2D', 'from-red-950 to-red-900', ARRAY['wood'], false, 3, true),
('colour', 'birch', 'Birch', '#E5C79F', 'from-amber-100 to-amber-200', ARRAY['wood'], false, 4, true),
('colour', 'silver', 'Silver', '#C0C0C0', 'from-gray-300 to-gray-400', ARRAY['metal'], false, 5, true),
('colour', 'rose-gold', 'Rose Gold', '#B76E79', 'from-rose-300 to-rose-400', ARRAY['metal'], false, 6, true)
ON CONFLICT (category, option_key) DO NOTHING;

-- Insert default patterns
INSERT INTO card_customization_options (category, option_key, label, display_order, is_enabled) VALUES
('pattern', 'geometric', 'Geometric', 1, true),
('pattern', 'minimalist', 'Minimalist', 2, true),
('pattern', 'abstract', 'Abstract', 3, true)
ON CONFLICT (category, option_key) DO NOTHING;
