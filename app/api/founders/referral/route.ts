import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionStore } from '@/lib/session-store';
import { sendOrderEmail } from '@/lib/smtp-email-service';
import { cookies } from 'next/headers';

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

// GET - Fetch current user's referral stats and list
export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await SessionStore.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Fetch user with founding member status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_founding_member, referrals_used, max_referrals')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.is_founding_member) {
      return NextResponse.json(
        { success: false, error: 'Only founding members can access referrals' },
        { status: 403 }
      );
    }

    // Fetch all referrals created by this user
    const { data: referrals, error: referralsError } = await supabase
      .from('founders_invite_codes')
      .select('id, code, email, referred_first_name, referred_last_name, created_at, expires_at, used_at')
      .eq('referrer_user_id', user.id)
      .eq('referral_type', 'referral')
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
    }

    // Map referrals with status
    const referralList = (referrals || []).map(ref => ({
      id: ref.id,
      firstName: ref.referred_first_name,
      lastName: ref.referred_last_name,
      email: ref.email,
      code: ref.code,
      createdAt: ref.created_at,
      expiresAt: ref.expires_at,
      status: ref.used_at ? 'used' : (new Date(ref.expires_at) < new Date() ? 'expired' : 'pending')
    }));

    return NextResponse.json({
      success: true,
      referralsUsed: user.referrals_used || 0,
      maxReferrals: user.max_referrals || 3,
      remaining: (user.max_referrals || 3) - (user.referrals_used || 0),
      referrals: referralList
    });

  } catch (error) {
    console.error('Error in GET /api/founders/referral:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
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

    const normalizedEmail = email.toLowerCase().trim();

    // Get session from cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await SessionStore.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Fetch user with founding member status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, is_founding_member, founding_member_plan, referrals_used, max_referrals')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a founding member
    if (!user.is_founding_member) {
      return NextResponse.json(
        { success: false, error: 'Only founding members can refer others' },
        { status: 403 }
      );
    }

    // Check referral limit
    const referralsUsed = user.referrals_used || 0;
    const maxReferrals = user.max_referrals || 3;

    if (referralsUsed >= maxReferrals) {
      return NextResponse.json(
        { success: false, error: `You have reached your maximum of ${maxReferrals} referrals` },
        { status: 400 }
      );
    }

    // Check if referred email is already a founding member
    const { data: existingMember } = await supabase
      .from('users')
      .select('id, is_founding_member')
      .eq('email', normalizedEmail)
      .single();

    if (existingMember?.is_founding_member) {
      return NextResponse.json(
        { success: false, error: 'This person is already a Founding Member' },
        { status: 400 }
      );
    }

    // Check if there's already a pending/unused code for this email
    const { data: existingCode } = await supabase
      .from('founders_invite_codes')
      .select('id, used_at, expires_at')
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'This person already has a pending invite code' },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

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
        { success: false, error: 'Failed to generate unique code. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate expiry (72 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Create invite code with referral info
    // Note: phone is required in the table schema, so we use empty string for referrals
    const { error: codeError } = await supabase
      .from('founders_invite_codes')
      .insert({
        code: inviteCode,
        email: normalizedEmail,
        phone: '', // Empty for referral codes - user fills at checkout
        referrer_user_id: user.id,
        referral_type: 'referral',
        referred_first_name: firstName.trim(),
        referred_last_name: lastName.trim(),
        inherited_plan: user.founding_member_plan || 'lifetime',
        expires_at: expiresAt.toISOString()
      });

    if (codeError) {
      console.error('Error creating referral code:', codeError);
      return NextResponse.json(
        { success: false, error: 'Failed to create referral code' },
        { status: 500 }
      );
    }

    // Increment referrals_used counter
    const { error: updateError } = await supabase
      .from('users')
      .update({ referrals_used: referralsUsed + 1 })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating referral count:', updateError);
      // Not critical - code was created
    }

    // Send referral email
    const referrerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'A Linkist member';

    try {
      const emailResult = await sendOrderEmail({
        to: normalizedEmail,
        subject: `${referrerName} has invited you to join Linkist Founders Club`,
        html: getReferralEmailTemplate(referrerName, firstName.trim(), inviteCode, expiresAt)
      });

      if (emailResult.success) {
        console.log('Referral email sent to:', normalizedEmail);
      } else {
        console.error('Failed to send referral email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending referral email:', emailError);
      // Email failed but code was created - still consider it a success
    }

    return NextResponse.json({
      success: true,
      message: `Referral sent to ${normalizedEmail}`,
      referral: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        code: inviteCode,
        expiresAt: expiresAt.toISOString()
      },
      remaining: maxReferrals - referralsUsed - 1
    });

  } catch (error) {
    console.error('Error in POST /api/founders/referral:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function getReferralEmailTemplate(referrerName: string, referredFirstName: string, code: string, expiresAt: Date): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${referrerName} has invited you to join Linkist Founders Club</title>
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
          Hi ${referredFirstName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          <strong>${referrerName}</strong> has invited you to join the exclusive <strong>Linkist Founders Club</strong>!
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 15px;">
          Your exclusive invite code is:
        </p>

        <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px;">
          <p style="color: #78350f; font-size: 32px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 3px;">${code}</p>
        </div>

        <div style="text-align: center; margin: 0 0 30px;">
          <a href="https://www.linkist.ai/product-selection" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Click here to claim your membership</a>
        </div>

        <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px;">How to use your code:</h3>
        <ol style="color: #666666; font-size: 14px; line-height: 24px; margin: 0 0 30px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Click the button above or go to linkist.ai/product-selection</li>
          <li style="margin-bottom: 10px;">Click "Enter Code" on the Founders Club card</li>
          <li style="margin-bottom: 10px;">Enter this email address and your invite code</li>
          <li>Enjoy exclusive Founders Club benefits!</li>
        </ol>

        <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Your Founders Club Benefits:</h3>
        <ul style="color: #666666; font-size: 14px; line-height: 24px; margin: 0 0 30px; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Lifetime subscription to the Linkist Pro App</li>
          <li style="margin-bottom: 8px;">Premium Metal NFC Card</li>
          <li style="margin-bottom: 8px;">"Founding Member" tag on your card</li>
          <li style="margin-bottom: 8px;">No expiry on AI credits</li>
          <li style="margin-bottom: 8px;">Fully customisable card</li>
          <li>Up to 3 referral invites to the Founders Club</li>
        </ul>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 0 0 30px;">
          <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #991b1b; font-size: 14px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 5px;">This invite code expires in 72 hours</li>
            <li style="margin-bottom: 5px;">The code can only be used once</li>
            <li>You must use this email address to activate</li>
          </ul>
        </div>

        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          We're excited to welcome you to the Founders Club!
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
          You received this email because ${referrerName} invited you to join Linkist Founders Club.
        </p>
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
