import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderEmail } from '@/lib/smtp-email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, reason } = body;

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

    // Update request status to rejected
    const { error: updateError } = await supabase
      .from('founders_requests')
      .update({
        status: 'rejected',
        rejected_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error rejecting request:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reject request' },
        { status: 500 }
      );
    }

    // Send rejection email using SMTP service
    try {
      const emailResult = await sendOrderEmail({
        to: foundersRequest.email,
        subject: 'Update on Your Founders Club Request - Linkist',
        html: getRejectionEmailTemplate(foundersRequest.full_name, reason || null)
      });

      if (emailResult.success) {
        console.log('✅ Rejection email sent to:', foundersRequest.email);
      } else {
        console.error('❌ Failed to send rejection email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending rejection email:', emailError);
      // Continue even if email fails - the rejection was recorded
    }

    return NextResponse.json({
      success: true,
      message: 'Request rejected successfully'
    });

  } catch (error) {
    console.error('Error in founders reject API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function getRejectionEmailTemplate(name: string, reason: string | null): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Founders Club Request Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #374151 0%, #1f2937 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Founders Club Update</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Hi ${name},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Thank you for your interest in joining the Linkist Founders Club.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          After careful review, we regret to inform you that we are unable to approve your request at this time.
        </p>
        ${reason ? `
        <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 0 0 20px;">
          <p style="color: #374151; font-size: 14px; margin: 0;">
            <strong>Reason:</strong> ${reason}
          </p>
        </div>
        ` : ''}
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          This decision doesn't reflect on your qualifications. The Founders Club has limited spots and we had to make difficult choices.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
          You can still enjoy our regular Linkist products and services. We'd love to have you as part of our community!
        </p>

        <div style="text-align: center;">
          <a href="https://linkist.ai/product-selection" style="display: inline-block; background: linear-gradient(135deg, #374151 0%, #1f2937 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Explore Linkist Products
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px;">
          If you have any questions, feel free to reach out to our support team.
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
