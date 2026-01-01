import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

    // Code is valid! Mark as used and update user as founding member

    // 1. Mark the invite code as used
    const { error: updateCodeError } = await supabase
      .from('founders_invite_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteCode.id);

    if (updateCodeError) {
      console.error('Error marking code as used:', updateCodeError);
      return NextResponse.json(
        { success: false, error: 'Failed to process code. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Check if user exists with this email
    const { data: existingUser, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userLookupError && userLookupError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine (user doesn't exist yet)
      console.error('Error looking up user:', userLookupError);
    }

    if (existingUser) {
      // 3a. Update existing user as founding member
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          is_founding_member: true,
          founding_member_since: new Date().toISOString(),
          founding_member_plan: 'lifetime'
        })
        .eq('id', existingUser.id);

      if (updateUserError) {
        console.error('Error updating user as founding member:', updateUserError);
        // Don't fail the request - code is already marked as used
      }
    } else {
      // 3b. Create new user record with founding member status
      // Get name from the original request if available
      const { data: originalRequest } = await supabase
        .from('founders_requests')
        .select('full_name, phone')
        .eq('id', inviteCode.request_id)
        .single();

      const nameParts = originalRequest?.full_name?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || null;

      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          phone_number: originalRequest?.phone || inviteCode.phone,
          is_founding_member: true,
          founding_member_since: new Date().toISOString(),
          founding_member_plan: 'lifetime'
        });

      if (createUserError) {
        console.error('Error creating founding member user:', createUserError);
        // Don't fail the request - code is already marked as used
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Code validated successfully. You are now a Founding Member!',
      codeId: inviteCode.id,
      email: inviteCode.email,
      expiresAt: inviteCode.expires_at,
      isFoundingMember: true
    });

  } catch (error) {
    console.error('Error validating founders code:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Endpoint to mark code as used (called after successful purchase)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body;

    if (!code || !email) {
      return NextResponse.json(
        { success: false, error: 'Code and email are required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Verify and mark code as used
    const { data: inviteCode, error: lookupError } = await supabase
      .from('founders_invite_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('email', normalizedEmail)
      .single();

    if (lookupError || !inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid code or email' },
        { status: 400 }
      );
    }

    if (inviteCode.used_at) {
      return NextResponse.json(
        { success: false, error: 'Code already used' },
        { status: 400 }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('founders_invite_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteCode.id);

    if (updateError) {
      console.error('Error marking code as used:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update code status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code marked as used'
    });

  } catch (error) {
    console.error('Error marking founders code as used:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
