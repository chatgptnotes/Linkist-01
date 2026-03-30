import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import bcrypt from 'bcryptjs'
import { getCookieDomain } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  try {
    const { password, email } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Try per-user admin login first (if email provided)
    if (email) {
      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, username, password_hash, first_name, last_name, role, is_super_admin, is_active')
        .eq('email', email.toLowerCase())
        .single()

      if (!adminError && adminUser) {
        if (!adminUser.is_active) {
          return NextResponse.json(
            { success: false, error: 'Account is disabled. Contact super admin.' },
            { status: 403 }
          )
        }

        const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)

        if (!isValidPassword) {
          // Update failed login attempts
          await supabaseAdmin
            .from('admin_users')
            .update({
              failed_login_attempts: (adminUser as any).failed_login_attempts + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', adminUser.id)

          return NextResponse.json(
            { success: false, error: 'Invalid email or password' },
            { status: 401 }
          )
        }

        // Successful per-user login
        const sessionToken = await createAdminSession({
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          is_super_admin: adminUser.is_super_admin,
          first_name: adminUser.first_name || undefined,
          last_name: adminUser.last_name || undefined,
        })

        // Update last login
        await supabaseAdmin
          .from('admin_users')
          .update({
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', adminUser.id)

        const response = NextResponse.json({
          success: true,
          message: 'Admin login successful',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            first_name: adminUser.first_name,
            last_name: adminUser.last_name,
            role: adminUser.role,
            is_super_admin: adminUser.is_super_admin,
          }
        })

        response.cookies.set('admin_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 24 * 60 * 60,
          path: '/',
          domain: getCookieDomain(request.headers.get('host') || '')
        })

        return response
      }
    }

    // Fallback: PIN-based login (shared password from admin_password table)
    const { data: adminPassword, error: dbError } = await supabaseAdmin
      .from('admin_password' as any)
      .select('password_hash')
      .eq('id', 1)
      .single() as { data: { password_hash: string } | null; error: any }

    if (dbError || !adminPassword) {
      console.error('Failed to fetch admin password:', dbError)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, adminPassword.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // PIN-based login = super admin by default
    const sessionToken = await createAdminSession()

    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful'
    })

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60,
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
