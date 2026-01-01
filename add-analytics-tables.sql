-- Analytics Tables for Profile Dashboard
-- This file creates tables to track profile views and engagement

-- Profile Views Table
-- Tracks every time someone views a profile
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_email VARCHAR(255) NOT NULL,
    viewer_ip VARCHAR(45),
    viewer_user_agent TEXT,
    viewer_location JSONB,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_profile_email FOREIGN KEY (profile_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Engagement Events Table
-- Tracks clicks on WhatsApp, Email, Social Media links
CREATE TABLE IF NOT EXISTS engagement_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_email VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'linkedin', 'instagram', etc.
    event_action VARCHAR(50), -- 'click', 'copy', 'view'
    viewer_ip VARCHAR(45),
    metadata JSONB, -- Additional data like link clicked, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_engagement_profile_email FOREIGN KEY (profile_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_views_email ON profile_views(profile_email);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_engagement_events_email ON engagement_events(profile_email);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON engagement_events(created_at);

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_views
-- Users can only see analytics for their own profiles
CREATE POLICY "Users can view their own profile analytics"
    ON profile_views
    FOR SELECT
    USING (profile_email = current_setting('request.jwt.claims')::json->>'email');

-- Allow anyone to insert profile views (for tracking)
CREATE POLICY "Anyone can track profile views"
    ON profile_views
    FOR INSERT
    WITH CHECK (true);

-- RLS Policies for engagement_events
-- Users can only see their own engagement events
CREATE POLICY "Users can view their own engagement events"
    ON engagement_events
    FOR SELECT
    USING (profile_email = current_setting('request.jwt.claims')::json->>'email');

-- Allow anyone to track engagement events
CREATE POLICY "Anyone can track engagement events"
    ON engagement_events
    FOR INSERT
    WITH CHECK (true);
