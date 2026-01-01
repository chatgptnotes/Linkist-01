// Script to create test profile in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestProfile() {
  console.log('🔄 Creating test profile for username: bbb-ooo');

  // Delete existing profile if exists
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('custom_url', 'bbb-ooo');

  if (deleteError && deleteError.code !== 'PGRST116') {
    console.error('❌ Error deleting existing profile:', deleteError);
  } else {
    console.log('✅ Cleared existing profile (if any)');
  }

  // Insert new test profile
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        custom_url: 'bbb-ooo',
        profile_url: 'http://localhost:3002/bbb-ooo',
        email: 'bbqandrajaango@gmail.com',
        first_name: 'Bbb',
        last_name: 'Ooo',
        job_title: 'Copywriter @ashjk',
        company_name: 'All Enqueueland Hospital\'s CEO&MODERANMS',
        professional_summary: 'All Enqueueland Hospital\'s CEO&MODERANMS, Dear Sir/Madam, Greetings from M.JAIAY & P.JAIAY | State Health Assurance Society has organized an Interactive Session with Honble Health Minister On 11th October 2025 at Pune. You are invited for the programme & ensure that two senior members from your hospital to participate in the programme. The venue and timing details are mentioned in the attached invitation letter. Wishing You All Happy Diwali',
        profile_photo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=BO',
        background_image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
        primary_email: 'bbqandrajaango@gmail.com',
        mobile_number: '8993033932',
        phone_number: '8993033932',
        company_address: 'Vasantrao Naik Government Institute of Arts & Social Sciences, Civil Lines, Nagpur, Nagpur Utban Taluka, Nagpur, Maharashtra, 440001',
        company_website: 'bvhjk.com',
        social_links: {
          linkedin: 'https://linkedin.com/in/bbb-ooo',
          instagram: 'https://instagram.com/bbb-ooo',
          facebook: 'https://facebook.com/bbb-ooo',
          twitter: 'https://twitter.com/bbb-ooo',
          youtube: 'https://youtube.com/@bbb-ooo',
          github: 'https://github.com/bbb-ooo'
        }
      }
    ])
    .select();

  if (error) {
    console.error('❌ Error creating profile:', error);
    process.exit(1);
  }

  console.log('✅ Test profile created successfully!');
  console.log('📦 Profile data:', data);
  console.log('\n🌐 Visit: http://localhost:3002/bbb-ooo');

  process.exit(0);
}

createTestProfile();
