import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { createAdminSession, getCurrentUser, isAdminRole } from '@/lib/auth-middleware';
import { SessionStore } from '@/lib/session-store';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Try super_admin_credentials table first
    let credValid = false;
    let displayName = 'Super Admin';

    const { data: creds, error: credErr } = await supabase
      .from('super_admin_credentials')
      .select('*')
      .eq('email', trimmedEmail)
      .eq('is_active', true)
      .single();

    if (!credErr && creds) {
      // DB table exists and has credentials — verify against it
      credValid = await bcrypt.compare(password, creds.password_hash);
      displayName = creds.display_name || 'Super Admin';

      if (credValid) {
        // Update last_login
        await supabase
          .from('super_admin_credentials')
          .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', creds.id);
      }
    } else {
      // Table doesn't exist or no matching credentials — login fails
      // No hardcoded fallback — super_admin_credentials migration must be run first
      credValid = false;
    }

    if (!credValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Get or create the user record
    let { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', trimmedEmail)
      .single();

    // If user doesn't exist in users table, create one
    if (!user) {
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert({
          email: trimmedEmail,
          first_name: 'Super',
          last_name: 'Admin',
          role: 'super_admin',
          status: 'active',
          email_verified: true,
          mobile_verified: true,
        })
        .select('id, email, role')
        .single();

      if (createErr) {
        console.error('Failed to create super admin user:', createErr);
        return NextResponse.json({ error: 'Login failed — could not create user record' }, { status: 500 });
      }
      user = newUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 401 });
    }

    // Create session (same as OTP login flow — stores in user_sessions)
    // SessionStore.create expects (userId, email, role) as separate args
    const sessionId = await SessionStore.create(user.id, user.email, user.role || 'super_admin');

    // Also create admin session JWT (for admin panel access)
    const adminToken = await createAdminSession();

    // Set both cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: 'super_admin',
        display_name: displayName,
      },
    });

    // Session cookie (for user auth — 1 year)
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    // Admin session cookie (for admin panel — 24h)
    response.cookies.set('admin_session', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Super admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// PUT — Change super admin password (requires authenticated super_admin session)
export async function PUT(request: NextRequest) {
  try {
    // Require authenticated super_admin session
    const session = await getCurrentUser(request);
    const userRole = session.user?.db_role_name || session.user?.role;
    if (!session.isAuthenticated || userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { email, current_password, new_password } = await request.json();

    if (!email || !current_password || !new_password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify current password
    const { data: creds } = await supabase
      .from('super_admin_credentials')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!creds) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(current_password, creds.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password
    const newHash = await bcrypt.hash(new_password, 12);

    // Update
    const { error: updateErr } = await supabase
      .from('super_admin_credentials')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creds.id);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
