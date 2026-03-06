-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'footer'
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (email);

-- Create index on subscribed_at for sorting
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers (subscribed_at DESC);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (for the public form)
CREATE POLICY "Allow public inserts" ON newsletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);

-- Allow service role full access (for admin)
CREATE POLICY "Allow service role full access" ON newsletter_subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
