-- Founders Club Tables Migration
-- Creates tables for managing Founders Club access requests and invite codes

-- Table 1: founders_requests
-- Stores access request forms submitted by users who want to join Founders Club
CREATE TABLE IF NOT EXISTS founders_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  profession TEXT NOT NULL,
  note TEXT, -- Optional: "Why do you want to join the Founders Club?"
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejected_reason TEXT, -- Optional reason if rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table 2: founders_invite_codes
-- Stores invite codes generated when admin approves a request
-- Codes have 72-hour validity and are tied to specific email/phone
CREATE TABLE IF NOT EXISTS founders_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Format: FC-XXXXXXXX (8 alphanumeric chars)
  email TEXT NOT NULL, -- Tied to requester's email
  phone TEXT NOT NULL, -- Tied to requester's phone
  request_id UUID REFERENCES founders_requests(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- 72 hours from creation
  used_at TIMESTAMPTZ, -- NULL until code is used
  created_by_admin UUID, -- Admin who approved/generated the code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_founders_requests_email ON founders_requests(email);
CREATE INDEX IF NOT EXISTS idx_founders_requests_status ON founders_requests(status);
CREATE INDEX IF NOT EXISTS idx_founders_requests_created_at ON founders_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_founders_invite_codes_code ON founders_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_founders_invite_codes_email ON founders_invite_codes(email);
CREATE INDEX IF NOT EXISTS idx_founders_invite_codes_expires_at ON founders_invite_codes(expires_at);

-- Trigger to update updated_at on founders_requests
CREATE OR REPLACE FUNCTION update_founders_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_founders_requests_updated_at ON founders_requests;
CREATE TRIGGER trigger_update_founders_requests_updated_at
  BEFORE UPDATE ON founders_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_founders_requests_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE founders_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE founders_invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to founders_requests"
  ON founders_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to founders_invite_codes"
  ON founders_invite_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE founders_requests IS 'Stores Founders Club access requests from users';
COMMENT ON TABLE founders_invite_codes IS 'Stores invite codes with 72-hour validity for Founders Club access';
COMMENT ON COLUMN founders_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN founders_invite_codes.expires_at IS 'Code expires 72 hours after creation';
COMMENT ON COLUMN founders_invite_codes.used_at IS 'Timestamp when code was used, NULL if unused';
