import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderEmail } from '@/lib/smtp-email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Generate a unique 8-character alphanumeric code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FC-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Fetch the request
    const { data: foundersRequest, error: fetchError } = await supabase
      .from('founders_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !foundersRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    if (foundersRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('founders_invite_codes')
        .select('id')
        .eq('code', inviteCode)
        .single();

      if (!existing) break;

      inviteCode = generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Calculate expiry (72 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Create invite code
    const { error: codeError } = await supabase
      .from('founders_invite_codes')
      .insert({
        code: inviteCode,
        email: foundersRequest.email,
        phone: foundersRequest.phone,
        request_id: requestId,
        expires_at: expiresAt.toISOString()
      });

    if (codeError) {
      console.error('Error creating invite code:', codeError);
      return NextResponse.json(
        { success: false, error: 'Failed to create invite code' },
        { status: 500 }
      );
    }

    // Update request status to approved
    const { error: updateError } = await supabase
      .from('founders_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      // Code was created but status update failed - not critical
    }

    // Send email with invite code using SMTP service
    try {
      // Combine first_name and last_name since the database stores them separately
      const fullName = `${foundersRequest.first_name || ''} ${foundersRequest.last_name || ''}`.trim();

      const emailResult = await sendOrderEmail({
        to: foundersRequest.email,
        subject: "You're approved — unlock your Founders Circle access",
        html: getEmailTemplate(fullName, inviteCode, expiresAt)
      });

      if (emailResult.success) {
        console.log('✅ Approval email sent to:', foundersRequest.email);
      } else {
        console.error('❌ Failed to send approval email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      // Email failed but code was created - still consider it a success
    }

    return NextResponse.json({
      success: true,
      code: inviteCode,
      expiresAt: expiresAt.toISOString(),
      message: 'Request approved and invite code generated'
    });

  } catch (error) {
    console.error('Error in founders approve API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function getEmailTemplate(name: string, code: string, expiresAt: Date): string {
  // Use full name for greeting
  const fullName = name || 'there';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're approved — unlock your Founders Circle access</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #000000;">
        <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://linkist.ai'}/logo2.png" alt="Linkist" style="height: 50px; width: auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Hi ${fullName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Great news — your request to join the Linkist Founders Circle has been approved.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 15px;">
          Your exclusive Founders Circle invite code is:
        </p>

        <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px;">
          <p style="color: #78350f; font-size: 32px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 3px;">${code}</p>
        </div>

        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 25px;">
          You can get started right away by unlocking your access and customising your NFC card.
        </p>

        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
          <a href="https://www.linkist.ai/product-selection" style="color: #f59e0b; text-decoration: underline; font-weight: bold;">Click here</a> to proceed directly to your Founders Circle card customisation.
        </p>

        <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px;">How to use your code:</h3>
        <ol style="color: #666666; font-size: 14px; line-height: 24px; margin: 0 0 30px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Go to the Linkist plan selection page</li>
          <li style="margin-bottom: 10px;">Click "Enter Code" on the Founders Circle card</li>
          <li style="margin-bottom: 10px;">Enter your email and invite code to unlock access</li>
          <li>Enjoy exclusive Founders Circle benefits</li>
        </ol>

        <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Your Founders Circle Benefits:</h3>
        <ul style="color: #666666; font-size: 14px; line-height: 24px; margin: 0 0 30px; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Lifetime subscription to the Linkist Pro App</li>
          <li style="margin-bottom: 8px;">Premium Metal NFC Card</li>
          <li style="margin-bottom: 8px;">"Founding Member" tag on your card</li>
          <li style="margin-bottom: 8px;">No expiry on AI credits</li>
          <li style="margin-bottom: 8px;">Fully customisable card</li>
          <li>Up to 3 referral invites to the Founders Circle</li>
        </ul>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 0 0 30px;">
          <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px;">
            <strong>Important details:</strong>
          </p>
          <ul style="color: #991b1b; font-size: 14px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 5px;">This invite code is time-bound and will expire in 72 hours.</li>
            <li>The code can be used only once.</li>
          </ul>
        </div>

        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          We're excited to welcome you as a Founding Member.
        </p>

        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 5px;">
          Warm regards,
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 5px; font-weight: bold;">
          The Linkist Team
        </p>
        <p style="color: #666666; font-size: 14px; font-style: italic; margin: 0;">
          Connect Smarter. Network Better.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px;">
          This email was sent to you because you requested access to Linkist Founders Circle.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Linkist. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
