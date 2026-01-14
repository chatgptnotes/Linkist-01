-- Admin Password Table for simple admin authentication
-- This stores a single hashed password for admin panel access

CREATE TABLE IF NOT EXISTS admin_password (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one row allowed
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default password (hashed "admin123")
-- bcrypt hash for "admin123" with 12 rounds
INSERT INTO admin_password (id, password_hash)
VALUES (1, '$2b$12$iOdwOx3NMlOHw5h8TyVz9uJvj8J3DSQ5vly6a4rGmXppS5GQYIjcy')
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE admin_password IS 'Stores the admin panel access password (single row only)';
