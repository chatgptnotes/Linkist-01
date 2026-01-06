import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const authSession = await getCurrentUser(request);
    const authenticatedEmail = authSession?.user?.email;

    const { username, firstName, lastName, email, baseOrigin } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Require authentication
    if (!authenticatedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (username.startsWith('-') || username.endsWith('-')) {
      return NextResponse.json(
        { error: 'Username cannot start or end with a hyphen' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get base URL from request (dynamically from frontend) or fallback to environment
    const baseUrl = baseOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const fullProfileUrl = `${baseUrl}/${username}`;

    // Use authenticated email (from session) - this is the source of truth
    const userEmail = authenticatedEmail;

    // Check if username is still available (only if custom_url column exists)
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('custom_url, email')
        .eq('custom_url', username)
        .maybeSingle();

      // If username exists and belongs to a different user, reject
      if (existingProfile && !checkError) {
        // Allow if it's the user's own username
        if (existingProfile.email !== userEmail) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
      }
    } catch (error) {
      console.log('custom_url column might not exist yet, continuing...');
    }

    // First, get user_id from users table by email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    const userId = user?.id || null;

    // Check if profile exists for this user (using 'email' column, not 'user_email')
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (userProfile) {
      // Update existing profile
      const updateData: any = {
        user_id: userId,
        first_name: firstName || userProfile.first_name,
        last_name: lastName || userProfile.last_name,
        custom_url: username,
        profile_url: fullProfileUrl,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to save username', details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      // Create new profile
      const insertData: any = {
        user_id: userId,
        email: userEmail,
        first_name: firstName || null,
        last_name: lastName || null,
        custom_url: username,
        profile_url: fullProfileUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(insertData);

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json(
          { error: 'Failed to save username', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      username,
      profileUrl: fullProfileUrl,  // Return full URL to frontend
      message: 'Username saved successfully'
    });

  } catch (error) {
    console.error('Error saving username:', error);
    return NextResponse.json(
      { error: 'Failed to save username' },
      { status: 500 }
    );
  }
}
