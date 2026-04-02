-- Password Reset Tokens table for forgot-password flow
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('admin', 'super_admin')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);

-- Auto-cleanup expired tokens (older than 24 hours)
-- Run periodically or rely on application-level cleanup
COMMENT ON TABLE password_reset_tokens IS 'Stores temporary tokens for admin/super-admin password resets';
