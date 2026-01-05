import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderEmail } from '@/lib/smtp-email-service';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, companyName, email, phone, profession, note } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !profession) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists in users table
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id, email, is_founding_member')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUserByEmail) {
      if (existingUserByEmail.is_founding_member) {
        return NextResponse.json(
          { success: false, error: 'This email is already registered as a Founders Club member.' },
          { status: 400 }
        );
      }
      // User exists but not a founding member - they can still request (will upgrade existing account)
    }

    // Check if phone already exists in users table (with different email)
    const { data: existingUserByPhone } = await supabase
      .from('users')
      .select('id, email, phone_number')
      .eq('phone_number', phone.trim())
      .single();

    if (existingUserByPhone && existingUserByPhone.email.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json(
        { success: false, error: 'This phone number is already registered with a different account. Please use a different phone number or use the email associated with this phone.' },
        { status: 400 }
      );
    }

    // Check for existing pending request with same email
    const { data: existingRequest } = await supabase
      .from('founders_requests')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending request. Please wait for approval.' },
        { status: 400 }
      );
    }

    // Check for existing approved request
    const { data: approvedRequest } = await supabase
      .from('founders_requests')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'approved')
      .single();

    if (approvedRequest) {
      // Check if user already activated (is a founding member)
      const { data: member } = await supabase
        .from('founding_members')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (member) {
        return NextResponse.json(
          { success: false, error: 'You are already a Founders Club member.' },
          { status: 400 }
        );
      }

      // Check if their invite code has expired
      const { data: inviteCode } = await supabase
        .from('founders_invite_codes')
        .select('id, expires_at, used_at')
        .eq('request_id', approvedRequest.id)
        .single();

      if (inviteCode && !inviteCode.used_at) {
        const expiresAt = new Date(inviteCode.expires_at);
        if (expiresAt >= new Date()) {
          // Code still valid
          return NextResponse.json(
            { success: false, error: 'You already have an active invite code. Please check your email.' },
            { status: 400 }
          );
        }
        // Code expired - allow new request (fall through)
      }
    }

    // Insert new request
    const { data: newRequest, error: insertError } = await supabase
      .from('founders_requests')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName?.trim() || null,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        profession: profession.trim(),
        note: note?.trim() || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating founders request:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    try {
      const emailResult = await sendOrderEmail({
        to: email.toLowerCase().trim(),
        subject: 'Your Founders Club access request is under review',
        html: getFoundersRequestConfirmationEmail(firstName.trim(), lastName.trim())
      });

      if (emailResult.success) {
        console.log('✅ Founders request confirmation email sent to:', email);
      } else {
        console.error('❌ Failed to send confirmation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError);
      // Email failure should not block the request submission
    }

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      requestId: newRequest.id
    });

  } catch (error) {
    console.error('Error in founders request API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to check request status (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: requests, error } = await supabase
      .from('founders_requests')
      .select('id, status, created_at')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to check status' },
        { status: 500 }
      );
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({
        success: true,
        hasRequest: false
      });
    }

    return NextResponse.json({
      success: true,
      hasRequest: true,
      status: requests[0].status,
      createdAt: requests[0].created_at
    });

  } catch (error) {
    console.error('Error checking founders request status:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Email template for founders request confirmation
function getFoundersRequestConfirmationEmail(firstName: string, lastName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Founders Club Request Received</title>
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
          Hi ${firstName} ${lastName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Thank you for your interest in joining the Linkist Founders Club.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          We've successfully received your request, and our team is currently reviewing it. If your request is approved, you'll receive a unique invite code that you can use to unlock Founders Club access and continue your journey with Linkist.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
          You can expect to hear back from us within 24 hours.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          We appreciate your interest and look forward to connecting with you soon.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 30px 0 5px;">
          Warm regards,
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 5px; font-weight: 600;">
          The Linkist Team
        </p>
        <p style="color: #ef4444; font-size: 14px; font-style: italic; margin: 0;">
          Network Differently.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Linkist. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
