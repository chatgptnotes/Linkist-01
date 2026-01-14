-- Migration: Add referral support for Founder's Club members
-- Each founding member can refer up to 3 people

-- Add referral columns to founders_invite_codes table
ALTER TABLE founders_invite_codes
ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE founders_invite_codes
ADD COLUMN IF NOT EXISTS referral_type TEXT DEFAULT 'admin' CHECK (referral_type IN ('admin', 'referral'));

ALTER TABLE founders_invite_codes
ADD COLUMN IF NOT EXISTS referred_first_name TEXT;

ALTER TABLE founders_invite_codes
ADD COLUMN IF NOT EXISTS referred_last_name TEXT;

ALTER TABLE founders_invite_codes
ADD COLUMN IF NOT EXISTS inherited_plan TEXT CHECK (inherited_plan IN ('lifetime', 'annual', 'monthly', NULL));

-- Add referral tracking to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referrals_used INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 3;

-- Index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_founders_codes_referrer ON founders_invite_codes(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_founders_codes_referral_type ON founders_invite_codes(referral_type);

-- Update existing codes to have referral_type = 'admin'
UPDATE founders_invite_codes
SET referral_type = 'admin'
WHERE referral_type IS NULL;

-- Comment: Referral flow
-- 1. Founding member creates referral via /api/founders/referral
-- 2. System generates FC-XXXXXXXX code with referral_type = 'referral'
-- 3. Email sent to referred person with code
-- 4. Referred person activates via /api/founders/activate
-- 5. New member inherits plan from inherited_plan column
