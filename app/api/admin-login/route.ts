import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Get admin password from database
    const { data: adminPassword, error: dbError } = await supabaseAdmin
      .from('admin_password')
      .select('password_hash')
      .eq('id', 1)
      .single()

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
      console.log('Invalid admin password attempt')
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create admin session token
    const sessionToken = await createAdminSession()

    console.log('Admin login successful')

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
      domain: process.env.COOKIE_DOMAIN || undefined
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

export async function DELETE() {
  try {
    console.log('Admin logout requested')

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
      domain: process.env.COOKIE_DOMAIN || undefined
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
