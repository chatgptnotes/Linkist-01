import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { getTransporterInstance, EMAIL_CONFIG } from '@/lib/smtp-email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    // type = 'admin' (staff PIN reset) or 'super_admin'
    if (!type || !['admin', 'super_admin'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reset type' }, { status: 400 })
    }

    // For admin (staff) PIN reset, email is the configured admin email
    // For super_admin, email is required
    let targetEmail = ''

    if (type === 'super_admin') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }
      const trimmed = email.toLowerCase().trim()

      // Verify the email exists in super_admin_credentials
      const { data: creds } = await supabase
        .from('super_admin_credentials')
        .select('email, is_active')
        .eq('email', trimmed)
        .eq('is_active', true)
        .single()

      if (!creds) {
        // Don't reveal whether account exists - always return success
        return NextResponse.json({
          success: true,
          message: 'If that email is registered, a reset link has been sent.'
        })
      }
      targetEmail = creds.email
    } else {
      // Admin/staff PIN reset - send to ADMIN_EMAIL or SMTP_USER
      targetEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@linkist.ai'
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Invalidate any existing tokens for this email+type
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('email', targetEmail)
      .eq('token_type', type)
      .eq('used', false)

    // Store token in database
    const { error: insertErr } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: targetEmail,
        token,
        token_type: type,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (insertErr) {
      console.error('Failed to create reset token:', insertErr)
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    // Build reset URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000'
    const protocol = siteUrl.includes('localhost') ? 'http' : 'https'
    const baseUrl = siteUrl.startsWith('http') ? siteUrl : `${protocol}://${siteUrl}`
    const resetUrl = `${baseUrl}/reset-password?token=${token}&type=${type}`

    // Send email
    const transporter = getTransporterInstance()
    if (!transporter) {
      console.error('SMTP not configured for password reset')
      return NextResponse.json({ error: 'Email service not available' }, { status: 500 })
    }

    const typeLabel = type === 'super_admin' ? 'Super Admin' : 'Staff Admin'

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: targetEmail,
      subject: `Linkist ${typeLabel} Password Reset`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000; border-radius: 10px 10px 0 0;">
            <tr>
              <td style="padding: 30px; text-align: center;">
                <img src="https://linkist.ai/logo2.png" alt="Linkist" style="height: 60px; width: auto;" />
              </td>
            </tr>
          </table>

          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>

            <p style="font-size: 16px; color: #4b5563;">
              We received a request to reset your <strong>${typeLabel}</strong> password.
            </p>

            <p style="font-size: 16px; color: #4b5563;">
              Click the button below to set a new password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              This link will expire in <strong>30 minutes</strong>.
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              If you didn't request this, please ignore this email. Your password will remain unchanged.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              &copy; 2025 Linkist NFC. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    console.log(`Password reset email sent to ${targetEmail} for type ${type}`)

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
