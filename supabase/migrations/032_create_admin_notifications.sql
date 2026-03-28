-- Create admin_notifications table for internal admin event notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'order_status', 'new_customer', 'founder_request', 'payment', 'low_stock', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,                    -- e.g. '/admin/orders' or '/admin/founders'
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index for fast unread count queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications (is_read, created_at DESC);

-- Index for listing recent notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications (created_at DESC);

-- Auto-cleanup: delete notifications older than 90 days (optional scheduled job)
-- For now, we'll handle cleanup in the API layer
