#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function testProfileCreation() {
  console.log('Testing profile creation for bhupendrabalapure@gmail.com...\n');

  // Find the user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'bhupendrabalapure@gmail.com')
    .single();

  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User found:', user.id);
  console.log('   Email:', user.email);
  console.log('   Name:', user.first_name, user.last_name, '\n');

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'bhupendrabalapure@gmail.com')
    .single();

  if (existingProfile) {
    console.log('📋 Existing profile found:');
    console.log('   Profile ID:', existingProfile.id);
    console.log('   User ID:', existingProfile.user_id);
    console.log('   Email:', existingProfile.email, '\n');

    if (!existingProfile.user_id) {
      console.log('🔧 Fixing NULL user_id...\n');

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ user_id: user.id })
        .eq('id', existingProfile.id)
        .select();

      if (error) {
        console.error('❌ Failed to update:', error);
      } else {
        console.log('✅ Profile updated successfully!');
        console.log('   New user_id:', updated[0].user_id);
      }
    } else {
      console.log('✅ Profile already has valid user_id');
    }
  } else {
    console.log('⚠️  No profile found for this email');
  }
}

testProfileCreation();
