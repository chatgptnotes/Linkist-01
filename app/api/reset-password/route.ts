import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json()

    if (!token || !new_password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Look up the token
    const { data: resetToken, error: tokenErr } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenErr || !resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      // Mark as used
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id)

      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Hash new password
    const newHash = await bcrypt.hash(new_password, 12)

    if (resetToken.token_type === 'super_admin') {
      // Update super_admin_credentials table
      const { error: updateErr } = await supabase
        .from('super_admin_credentials')
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('email', resetToken.email)

      if (updateErr) {
        console.error('Failed to update super admin password:', updateErr)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
      }
    } else {
      // Update admin_password table (staff PIN)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase.from('admin_password' as any) as any).update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (updateErr) {
        console.error('Failed to update admin password:', updateErr)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
      }
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    console.log(`Password reset successful for ${resetToken.email} (${resetToken.token_type})`)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
      type: resetToken.token_type,
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
