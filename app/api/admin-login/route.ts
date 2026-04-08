import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, getCurrentUser, isAdminRole } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import bcrypt from 'bcryptjs'
import { getCookieDomain } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Require an existing user session — admin password is a secondary gate,
    // not a standalone login. The user must already be logged in.
    const session = await getCurrentUser(request)
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in first' },
        { status: 401 }
      )
    }

    // Only staff roles can unlock the admin panel
    if (!isAdminRole(session.user.db_role_name || session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get admin password from database
    const { data: adminPassword, error: dbError } = await supabaseAdmin
      .from('admin_password' as any)
      .select('password_hash')
      .eq('id', 1)
      .single() as { data: { password_hash: string } | null; error: any }

    if (dbError || !adminPassword) {
      console.error('Failed to fetch admin password:', dbError)
      return NextResponse.json(
        { success: false, error: 'Authentication system error' },
        { status: 500 }
      )
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, adminPassword.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create admin session token with the authenticated user's ID
    const sessionToken = await createAdminSession(session.user.id)

    // Set secure cookie with the session token (24 hours)
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful'
    })

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
      domain: getCookieDomain(request.headers.get('host') || '')
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear admin session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
      domain: getCookieDomain(request.headers.get('host') || '')
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
