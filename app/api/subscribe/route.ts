import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const name = [firstName, lastName].filter(Boolean).join(' ').trim();

    // Store in Supabase
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email, name, source: 'footer', status: 'active' },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('Supabase insert error:', dbError);
    }

    // Send notification email to support
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.office365.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Linkist <hello@linkist.ai>',
        to: 'support@linkist.ai',
        subject: `New Newsletter Subscription: ${name || email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E02424;">New Newsletter Subscription</h2>
            <p>A new user has subscribed to the Linkist newsletter:</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
              </tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              This notification was sent from the Linkist website footer subscription form.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the subscription if email notification fails
    }

    return NextResponse.json({ success: true, message: 'Subscription successful!' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
