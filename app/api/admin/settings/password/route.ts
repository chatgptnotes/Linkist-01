import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import bcrypt from 'bcryptjs'

// Change admin password
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get current password hash from database
    const { data: adminPassword, error: dbError } = await supabaseAdmin
      .from('admin_password')
      .select('password_hash')
      .eq('id', 1)
      .single()

    if (dbError || !adminPassword) {
      console.error('Failed to fetch admin password:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify current password' },
        { status: 500 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, adminPassword.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password in database
    const { error: updateError } = await supabaseAdmin
      .from('admin_password')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      )
    }

    console.log('Admin password changed successfully')

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
