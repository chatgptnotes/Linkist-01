-- Insert test profile data for "bbb-ooo" username
-- Run this in Supabase SQL Editor to create test profile

-- First, check if profile exists
DO $$
BEGIN
    -- Delete existing profile with this custom_url if it exists
    DELETE FROM profiles WHERE custom_url = 'bbb-ooo';

    -- Insert test profile
    INSERT INTO profiles (
        custom_url,
        profile_url,
        first_name,
        last_name,
        job_title,
        company_name,
        professional_summary,
        profile_photo_url,
        background_image_url,
        primary_email,
        mobile_number,
        company_address,
        company_website,
        social_links,
        created_at,
        updated_at
    ) VALUES (
        'bbb-ooo',
        'http://localhost:3002/bbb-ooo',
        'Bbb',
        'Ooo',
        'Copywriter @ashjk',
        'All Enqueueland Hospital''s CEO&MODERANMS',
        'All Enqueueland Hospital''s CEO&MODERANMS, Dear Sir/Madam, Greetings from M.JAIAY & P.JAIAY | State Health Assurance Society has organized an Interactive Session with Honble Health Minister On 11th October 2025 at Pune. You are invited for the programme & ensure that two senior members from your hospital to participate in the programme. The venue and timing details are mentioned in the attached invitation letter. Wishing You All Happy Diwali',
        'https://example.com/profile-photo.jpg',
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
        'bbqandrajaango@gmail.com',
        '8993033932',
        'Vasantrao Naik Government Institute of Arts & Social Sciences, Civil Lines, Nagpur, Nagpur Utban Taluka, Nagpur, Maharashtra, 440001',
        'bvhjk.com',
        '{
            "linkedin": "https://linkedin.com/in/bbb-ooo",
            "instagram": "https://instagram.com/bbb-ooo",
            "facebook": "https://facebook.com/bbb-ooo",
            "twitter": "https://twitter.com/bbb-ooo",
            "youtube": "https://youtube.com/@bbb-ooo",
            "github": "https://github.com/bbb-ooo"
        }'::jsonb,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Test profile created successfully for username: bbb-ooo';
    RAISE NOTICE 'Access at: http://localhost:3002/bbb-ooo';
END $$;

-- Verify the profile was created
SELECT
    custom_url,
    first_name,
    last_name,
    job_title,
    primary_email,
    created_at
FROM profiles
WHERE custom_url = 'bbb-ooo';
