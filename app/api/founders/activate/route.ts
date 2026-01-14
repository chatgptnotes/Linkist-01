import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionStore } from '@/lib/session-store';
import { linkProfileToUser } from '@/lib/profile-users-helpers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to generate unique custom_url (slug)
async function generateUniqueSlug(firstName: string, lastName: string, email: string): Promise<string> {
  // Generate base slug from firstName-lastName
  let baseSlug = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // If slug is empty or too short, use email prefix
  if (baseSlug.length < 3) {
    baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  // Check if this slug already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('custom_url, email')
    .eq('custom_url', baseSlug)
    .maybeSingle();

  // If no conflict or same email, use the base slug
  if (!existingProfile || existingProfile.email === email) {
    return baseSlug;
  }

  // Find unique slug by appending counter
  let counter = 1;
  while (true) {
    const testSlug = `${baseSlug}-${counter}`;
    const { data: testProfile } = await supabase
      .from('profiles')
      .select('custom_url')
      .eq('custom_url', testSlug)
      .maybeSingle();

    if (!testProfile) {
      return testSlug;
    }
    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body;

    // Validate required fields
    if (!code || !email) {
      return NextResponse.json(
        { success: false, error: 'Code and email are required' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedCode = code.toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    console.log('🔐 [founders/activate] Starting activation for:', normalizedEmail);

    // Look up the invite code
    const { data: inviteCode, error: lookupError } = await supabase
      .from('founders_invite_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (lookupError || !inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (inviteCode.used_at) {
      return NextResponse.json(
        { success: false, error: 'This code has already been used.' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const expiresAt = new Date(inviteCode.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invite code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if email matches (identity lock)
    if (inviteCode.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'This code is not associated with this email address.' },
        { status: 400 }
      );
    }

    console.log('✅ [founders/activate] Code validated successfully');

    // NOTE: We mark the code as used AFTER user creation/update succeeds
    // to prevent the bug where code gets marked used but user update fails

    // Check if user exists with this email
    const { data: existingUser, error: userLookupError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    let user = existingUser;

    if (userLookupError && userLookupError.code !== 'PGRST116') {
      console.error('Error looking up user:', userLookupError);
    }

    if (existingUser) {
      console.log('👤 [founders/activate] Updating existing user as founding member');

      // Fetch phone from founders_requests to update existing user
      let phoneFromRequest = null;
      if (inviteCode.request_id) {
        const { data: originalRequest } = await supabase
          .from('founders_requests')
          .select('phone')
          .eq('id', inviteCode.request_id)
          .single();
        phoneFromRequest = originalRequest?.phone;
      }
      // Fallback to invite code phone if not in request
      if (!phoneFromRequest && inviteCode.phone) {
        phoneFromRequest = inviteCode.phone;
      }

      // Determine the plan - use inherited_plan for referrals, otherwise 'lifetime'
      const memberPlan = inviteCode.referral_type === 'referral' && inviteCode.inherited_plan
        ? inviteCode.inherited_plan
        : 'lifetime';

      // Update existing user as founding member and activate (include phone if available)
      // Always update phone_number if we have it from founders_requests (even if user already has one)
      const { data: updatedUser, error: updateUserError } = await supabase
        .from('users')
        .update({
          is_founding_member: true,
          founding_member_since: new Date().toISOString(),
          founding_member_plan: memberPlan,
          status: 'active', // Activate user
          // Update names from referral if user doesn't have them
          ...(inviteCode.referral_type === 'referral' && inviteCode.referred_first_name && !existingUser.first_name && { first_name: inviteCode.referred_first_name }),
          ...(inviteCode.referral_type === 'referral' && inviteCode.referred_last_name && !existingUser.last_name && { last_name: inviteCode.referred_last_name }),
          // Always update phone_number if we have it from founders_requests
          ...(phoneFromRequest && { phone_number: phoneFromRequest })
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateUserError) {
        console.error('Error updating user:', updateUserError);
        // Check for phone number unique constraint violation
        if (updateUserError.code === '23505' && updateUserError.message?.includes('phone')) {
          return NextResponse.json(
            { success: false, error: 'This phone number is already registered with another account. Please contact support.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to update user. Please try again.' },
          { status: 500 }
        );
      }

      user = updatedUser;
      console.log('✅ [founders/activate] Existing user updated with phone:', updatedUser.phone_number);
    } else {
      console.log('🆕 [founders/activate] Creating new user from founders request');

      // Get data from the original request
      const { data: originalRequest, error: requestError } = await supabase
        .from('founders_requests')
        .select('first_name, last_name, phone, profession')
        .eq('id', inviteCode.request_id)
        .single();

      if (requestError) {
        console.error('Error fetching original request:', requestError);
      }

      // For referrals, leave name and phone empty - user fills at checkout
      // For admin codes, use the original request data
      let firstName = '';
      let lastName = '';
      let phoneNumber = '';

      if (inviteCode.referral_type === 'referral') {
        // Use referred name from invite code
        firstName = inviteCode.referred_first_name || '';
        lastName = inviteCode.referred_last_name || '';
        phoneNumber = '';
      } else if (originalRequest?.first_name) {
        firstName = originalRequest.first_name;
        lastName = originalRequest?.last_name || '';
        phoneNumber = originalRequest?.phone || inviteCode.phone || '';
      } else {
        firstName = 'Founder';
        phoneNumber = inviteCode.phone || '';
      }

      // Determine the plan - use inherited_plan for referrals, otherwise 'lifetime'
      const newMemberPlan = inviteCode.referral_type === 'referral' && inviteCode.inherited_plan
        ? inviteCode.inherited_plan
        : 'lifetime';

      // Create new user with founding member status
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber || null,
          is_founding_member: true,
          founding_member_since: new Date().toISOString(),
          founding_member_plan: newMemberPlan,
          status: 'active', // Activate immediately - code verification = email verification
          email_verified: true, // Email is verified since they received the code
          role: 'user'
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        // Check for phone number unique constraint violation
        if (createUserError.code === '23505' && createUserError.message?.includes('phone')) {
          return NextResponse.json(
            { success: false, error: 'This phone number is already registered with another account. Please contact support.' },
            { status: 400 }
          );
        }
        // Check for email unique constraint violation
        if (createUserError.code === '23505' && createUserError.message?.includes('email')) {
          return NextResponse.json(
            { success: false, error: 'This email is already registered. Please try logging in instead.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to create user account. Please try again.' },
          { status: 500 }
        );
      }

      user = newUser;
      console.log('✅ [founders/activate] New user created:', user.id);
    }

    // NOW mark the invite code as used (after user creation/update succeeded)
    const { error: updateCodeError } = await supabase
      .from('founders_invite_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteCode.id);

    if (updateCodeError) {
      console.error('Error marking code as used:', updateCodeError);
      // Don't fail the activation - user is already created/updated
      // Just log the error and continue
    } else {
      console.log('✅ [founders/activate] Code marked as used');
    }

    // Update the founders request status
    if (inviteCode.request_id) {
      await supabase
        .from('founders_requests')
        .update({
          status: 'completed',
          user_id: user.id
        })
        .eq('id', inviteCode.request_id);
    }

    // ====== CREATE PROFILE WITH AUTO-GENERATED SLUG ======
    console.log('📝 [founders/activate] Creating profile with auto-generated slug...');

    // Check if user already has a profile
    const { data: existingProfileLink } = await supabase
      .from('profile_users')
      .select('profile_id, profiles(id, custom_url)')
      .eq('user_id', user.id)
      .maybeSingle();

    let profileId: string;
    let customUrl: string;

    if (existingProfileLink?.profiles) {
      // User already has a profile - just update it
      const existingProfile = existingProfileLink.profiles as any;
      profileId = existingProfile.id;
      customUrl = existingProfile.custom_url;
      console.log('✅ [founders/activate] User already has profile with slug:', customUrl);

      // Update the profile to mark as founder member
      await supabase
        .from('profiles')
        .update({ is_founder_member: true })
        .eq('id', profileId);
    } else {
      // Create new profile with auto-generated slug
      const firstName = user.first_name || 'Founder';
      const lastName = user.last_name || '';

      // Generate unique slug
      customUrl = await generateUniqueSlug(firstName, lastName, normalizedEmail);

      // Get base URL for profile_url
      const origin = request.headers.get('origin') || request.headers.get('referer') || '';
      let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://linkist.ai';
      if (origin) {
        try {
          const url = new URL(origin);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch (e) {
          // Use default baseUrl
        }
      }
      const fullProfileUrl = `${baseUrl}/${customUrl}`;

      console.log('🔗 [founders/activate] Generated slug:', customUrl);

      // Create the profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: normalizedEmail,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone_number: user.phone_number,
          is_founder_member: true,
          custom_url: customUrl,
          profile_url: fullProfileUrl,
          preferences: {},
          display_settings: {}
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ [founders/activate] Error creating profile:', profileError);
        // Don't fail the whole activation - user is already created
      } else {
        profileId = newProfile.id;
        console.log('✅ [founders/activate] Profile created with ID:', profileId);

        // Link profile to user in junction table
        await linkProfileToUser(profileId, user.id);
        console.log('✅ [founders/activate] Profile linked to user');
      }
    }
    // ====== END PROFILE CREATION ======

    // Create session for auto-login
    console.log('🔑 [founders/activate] Creating session for user:', user.id);
    const sessionId = await SessionStore.create(user.id, user.email, user.role || 'user');

    // Determine the actual plan for response
    const responsePlan = inviteCode.referral_type === 'referral' && inviteCode.inherited_plan
      ? inviteCode.inherited_plan
      : 'lifetime';

    // Create response with user data including profile slug
    const response = NextResponse.json({
      success: true,
      message: 'Welcome to the Founders Club! Your account has been activated.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        is_founding_member: true,
        founding_member_plan: responsePlan,
        custom_url: customUrl // Include the auto-generated profile slug
      },
      isFoundingMember: true,
      profileSlug: customUrl // Also include at top level for easy access
    });

    // Set session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    };

    response.cookies.set('session', sessionId, cookieOptions);

    console.log('✅ [founders/activate] Activation complete, session created');

    return response;

  } catch (error) {
    console.error('Error in founders/activate:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
