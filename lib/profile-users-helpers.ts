/**
 * Profile-Users Junction Table Helpers
 *
 * Helper functions to work with the profile_users junction table
 * that links profiles to users.
 */

import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Get user_id from profile_id
 */
export async function getUserFromProfile(profileId: string): Promise<string | null> {
  console.log('[profile-users] Getting user for profile:', profileId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profile_users')
    .select('user_id')
    .eq('profile_id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[profile-users] No user linked to profile:', profileId);
      return null;
    }
    console.error('[profile-users] Error getting user:', error);
    throw new Error(`Failed to get user from profile: ${error.message}`);
  }

  console.log('[profile-users] Found user:', data.user_id);
  return data.user_id;
}

/**
 * Get profile_id from user_id
 */
export async function getProfileFromUser(userId: string): Promise<string | null> {
  console.log('[profile-users] Getting profile for user:', userId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profile_users')
    .select('profile_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[profile-users] No profile linked to user:', userId);
      return null;
    }
    console.error('[profile-users] Error getting profile:', error);
    throw new Error(`Failed to get profile from user: ${error.message}`);
  }

  console.log('[profile-users] Found profile:', data.profile_id);
  return data.profile_id;
}

/**
 * Link profile to user
 */
export async function linkProfileToUser(profileId: string, userId: string): Promise<boolean> {
  console.log('[profile-users] Linking profile', profileId, 'to user', userId);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profile_users')
    .insert({
      profile_id: profileId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    // Check if already linked (unique constraint violation)
    if (error.code === '23505') {
      console.log('[profile-users] Already linked');
      return true; // Already linked is success
    }
    console.error('[profile-users] Error linking:', error);
    throw new Error(`Failed to link profile to user: ${error.message}`);
  }

  console.log('[profile-users] ✅ Successfully linked');
  return true;
}

/**
 * Unlink profile from user
 */
export async function unlinkProfileFromUser(profileId: string, userId: string): Promise<boolean> {
  console.log('[profile-users] Unlinking profile', profileId, 'from user', userId);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profile_users')
    .delete()
    .eq('profile_id', profileId)
    .eq('user_id', userId);

  if (error) {
    console.error('[profile-users] Error unlinking:', error);
    throw new Error(`Failed to unlink profile from user: ${error.message}`);
  }

  console.log('[profile-users] ✅ Successfully unlinked');
  return true;
}

/**
 * Get user with profile data
 */
export async function getUserWithProfile(userId: string) {
  console.log('[profile-users] Getting user with profile:', userId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profile_users')
    .select(`
      user_id,
      profile_id,
      users (*),
      profiles (*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[profile-users] No profile for user:', userId);
      return null;
    }
    console.error('[profile-users] Error:', error);
    throw new Error(`Failed to get user with profile: ${error.message}`);
  }

  return data;
}

/**
 * Get profile with user data
 */
export async function getProfileWithUser(profileId: string) {
  console.log('[profile-users] Getting profile with user:', profileId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profile_users')
    .select(`
      user_id,
      profile_id,
      users (*),
      profiles (*)
    `)
    .eq('profile_id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[profile-users] No user for profile:', profileId);
      return null;
    }
    console.error('[profile-users] Error:', error);
    throw new Error(`Failed to get profile with user: ${error.message}`);
  }

  return data;
}

/**
 * Check if profile is linked to user
 */
export async function isProfileLinkedToUser(profileId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profile_users')
    .select('id')
    .eq('profile_id', profileId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[profile-users] Error checking link:', error);
    return false;
  }

  return !!data;
}

/**
 * Link profile to user by email matching
 * Useful for migration or fixing orphaned profiles
 */
export async function linkProfileToUserByEmail(profileEmail: string): Promise<boolean> {
  console.log('[profile-users] Linking profile by email:', profileEmail);

  const supabase = createAdminClient();

  // Find profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', profileEmail)
    .single();

  if (profileError || !profile) {
    console.log('[profile-users] Profile not found for email:', profileEmail);
    return false;
  }

  // Find user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', profileEmail)
    .single();

  if (userError || !user) {
    console.log('[profile-users] User not found for email:', profileEmail);
    return false;
  }

  // Link them
  return await linkProfileToUser(profile.id, user.id);
}
