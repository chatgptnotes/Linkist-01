import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/smtp-email-service';
import { SupabaseEmailOTPStore, SupabaseMobileOTPStore, generateEmailOTP, generateMobileOTP, cleanExpiredOTPs, type EmailOTPRecord } from '@/lib/supabase-otp-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { memoryOTPStore, generateOTP } from '@/lib/memory-otp-store';
import twilio from 'twilio';

// Rate limiting: Track recent OTP sends to prevent duplicates
const recentOTPSends = new Map<string, number>();
const OTP_SEND_COOLDOWN = 60000; // 60 seconds cooldown between OTP sends (prevents duplicate sends)

// Processing lock: Prevent concurrent processing of same identifier
const processingLocks = new Map<string, boolean>();
const lockTimeouts = new Map<string, NodeJS.Timeout>();

// Helper function to release processing lock
function releaseLock(identifier: string) {
  const timeout = lockTimeouts.get(identifier);
  if (timeout) {
    clearTimeout(timeout);
    lockTimeouts.delete(identifier);
  }
  processingLocks.delete(identifier);
}

export async function POST(request: NextRequest) {
  let identifier: string | undefined;

  try {
    const body = await request.json();
    const { emailOrPhone, email, mobile, firstName, lastName, isFoundingMember, foundingMemberPlan, foundingMemberSince } = body;

    // Determine identifier for rate limiting
    identifier = email || mobile || emailOrPhone;

    // Check if OTP was recently sent to this identifier
    const lastSentTime = recentOTPSends.get(identifier);
    const now = Date.now();

    if (lastSentTime && (now - lastSentTime) < OTP_SEND_COOLDOWN) {
      const waitTime = Math.ceil((OTP_SEND_COOLDOWN - (now - lastSentTime)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${waitTime} seconds before requesting another code`,
          rateLimited: true
        },
        { status: 429 }
      );
    }

    // Check if request is currently being processed
    if (processingLocks.get(identifier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request already in progress. Please wait.',
          rateLimited: true
        },
        { status: 429 }
      );
    }

    // Acquire processing lock
    processingLocks.set(identifier, true);

    // Set auto-release timeout (10 seconds max - reduced from 30s for faster recovery)
    const lockTimeout = setTimeout(() => {
      processingLocks.delete(identifier);
    }, 10000);
    lockTimeouts.set(identifier, lockTimeout);

    // Mark this identifier as having received an OTP
    recentOTPSends.set(identifier, now);

    // Clean up old entries (older than 1 minute)
    for (const [key, time] of recentOTPSends.entries()) {
      if (now - time > 60000) {
        recentOTPSends.delete(key);
      }
    }

    // New registration flow (has email OR mobile with firstName/lastName)
    const isNewRegistration = (email || mobile) && firstName && lastName;

    // If it's a new registration
    if (isNewRegistration) {
      const identifier = email || mobile;
      const isEmail = !!email;
      const isPhone = !!mobile;

      // Clean expired OTPs first (fallback to memory store if Supabase fails)
      try {
        await cleanExpiredOTPs();
      } catch (error) {
        // Supabase cleanup failed, using memory fallback
      }

      if (isEmail && email) {
        // Email registration
        // Check if SMTP is configured
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
          return NextResponse.json(
            { error: 'Email service not configured' },
            { status: 503 }
          );
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + (10 * 60 * 1000);

        // Try to store OTP in Supabase, fallback to memory store
        let stored = false;
        try {
          stored = await SupabaseEmailOTPStore.set(email, {
            user_id: null,
            email,
            otp,
            expires_at: new Date(expiresAt).toISOString(),
            verified: false,
            temp_user_data: {
              firstName,
              lastName,
              email,
              phone: null,
              isFoundingMember: isFoundingMember || false,
              foundingMemberPlan: foundingMemberPlan || null,
              foundingMemberSince: foundingMemberSince || null
            }
          });
        } catch (error) {
          // Supabase storage failed, using memory fallback
        }

        if (!stored) {
          // Fallback to memory storage for development
          memoryOTPStore.set(email, {
            otp,
            expiresAt,
            type: 'email',
            userData: {
              firstName,
              lastName,
              email,
              phone: null,
              isFoundingMember: isFoundingMember || false,
              foundingMemberPlan: foundingMemberPlan || null,
              foundingMemberSince: foundingMemberSince || null
            }
          });
          stored = true;
        }

        // Send email OTP
        try {
          const emailResult = await sendOTPEmail({
            to: email,
            otp,
            expiresInMinutes: 10
          });

          if (!emailResult.success) {
            if (process.env.NODE_ENV === 'production') {
              throw new Error(emailResult.error);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
              { error: 'Failed to send verification email' },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Verification code sent to your email',
          type: 'email',
          identifier: email,
          devOtp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
      }

      if (isPhone && mobile) {
        // Mobile registration
        // Check if Twilio is configured
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
        const useTwilio = twilioAccountSid && twilioAuthToken && twilioVerifyServiceSid;

        // Generate OTP for database storage (fallback or primary)
        const otp = generateOTP();
        const expiresAt = Date.now() + (10 * 60 * 1000);

        if (useTwilio) {
          try {
            const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

            const verification = await twilioClient.verify.v2
              .services(twilioVerifyServiceSid)
              .verifications.create({
                to: mobile,
                channel: 'sms'
              });

            // Store in database as backup with registration data (with fallback)
            try {
              await SupabaseMobileOTPStore.set(mobile, {
                user_id: null,
                mobile,
                otp,
                expires_at: new Date(expiresAt).toISOString(),
                verified: false,
                temp_user_data: {
                  firstName,
                  lastName,
                  email: null,
                  phone: mobile
                }
              });
            } catch (error) {
              memoryOTPStore.set(mobile, {
                otp,
                expiresAt,
                type: 'phone',
                userData: {
                  firstName,
                  lastName,
                  email: null,
                  phone: mobile
                }
              });
            }

            return NextResponse.json({
              success: true,
              message: 'Verification code sent to your mobile number',
              type: 'sms',
              identifier: mobile,
              smsStatus: 'sent'
            });
          } catch (twilioError: any) {
            // Fall through to database OTP
          }
        }

        // Database OTP (fallback or primary if no Twilio) with registration data
        try {
          await SupabaseMobileOTPStore.set(mobile, {
            user_id: null,
            mobile,
            otp,
            expires_at: new Date(expiresAt).toISOString(),
            verified: false,
            temp_user_data: {
              firstName,
              lastName,
              email: null,
              phone: mobile
            }
          });
        } catch (error) {
          memoryOTPStore.set(mobile, {
            otp,
            expiresAt,
            type: 'phone',
            userData: {
              firstName,
              lastName,
              email: null,
              phone: mobile
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Verification code generated',
          type: 'sms',
          identifier: mobile,
          devOtp: otp,
          smsStatus: useTwilio ? 'fallback' : 'database'
        });
      }
    }

    // EXISTING LOGIN FLOW
    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Determine if input is email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s-()]+$/;

    const isEmail = emailRegex.test(emailOrPhone);
    const isPhone = phoneRegex.test(emailOrPhone.replace(/[\s-()]/g, ''));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: 'Invalid email or phone number format' },
        { status: 400 }
      );
    }

    // Check if user exists in Supabase users table
    let user = null;
    let userEmail = '';
    let userPhone = '';

    if (isEmail) {
      const normalizedEmail = emailOrPhone.toLowerCase();
      user = await SupabaseUserStore.getByEmail(normalizedEmail);
      userEmail = normalizedEmail;
    } else if (isPhone) {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = emailOrPhone.replace(/[\s-()]/g, '');

      // Extract the base number (without country code)
      const baseNumber = cleanPhone.replace(/^\+?(\d+)/, (match, num) => {
        // Remove common country codes to get base number
        if (num.startsWith('971')) return num.slice(3); // UAE
        if (num.startsWith('91')) return num.slice(2);  // India
        if (num.startsWith('1')) return num.slice(1);   // US
        if (num.startsWith('44')) return num.slice(2);  // UK
        if (num.startsWith('966')) return num.slice(3); // Saudi
        if (num.startsWith('974')) return num.slice(3); // Qatar
        if (num.startsWith('968')) return num.slice(3); // Oman
        if (num.startsWith('965')) return num.slice(3); // Kuwait
        if (num.startsWith('973')) return num.slice(3); // Bahrain
        return num;
      });

      // Try multiple phone number formats with common country codes
      const phoneVariants = [
        cleanPhone,                     // As entered (e.g., +91504431709)
        `+${cleanPhone}`,               // With + prefix
        cleanPhone.replace(/^\+/, ''),  // Without + (e.g., 91504431709)
        baseNumber,                     // Just the number (e.g., 504431709)
        `+91${baseNumber}`,             // India code + number
        `+971${baseNumber}`,            // UAE code + number
        `+1${baseNumber}`,              // US code + number
        `+44${baseNumber}`,             // UK code + number
        `+966${baseNumber}`,            // Saudi code + number
        `+974${baseNumber}`,            // Qatar code + number
        `+968${baseNumber}`,            // Oman code + number
        `+965${baseNumber}`,            // Kuwait code + number
        `+973${baseNumber}`,            // Bahrain code + number
      ];

      // Remove duplicates
      const uniqueVariants = [...new Set(phoneVariants)];

      // Try each variant until we find a match
      for (const variant of uniqueVariants) {
        user = await SupabaseUserStore.getByPhone(variant);
        if (user) {
          userPhone = user.phone_number || variant; // Use stored phone number
          break;
        }
      }

      if (user && user.email) {
        userEmail = user.email;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email or phone number. Please register first.' },
        { status: 404 }
      );
    }

    // For phone login, we need the phone number for SMS
    // For email login, we need the email
    if (isPhone && !userPhone) {
      return NextResponse.json(
        { error: 'User account found but no phone number associated. Please contact support.' },
        { status: 400 }
      );
    }

    if (isEmail && !userEmail) {
      return NextResponse.json(
        { error: 'User account found but no email associated. Please contact support.' },
        { status: 400 }
      );
    }

    // Clean expired OTPs first
    await cleanExpiredOTPs();

    // ==================== PHONE NUMBER LOGIN (SMS) ====================
    if (isPhone && userPhone) {
      // Check if Twilio is configured
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
      const useTwilio = twilioAccountSid && twilioAuthToken && twilioVerifyServiceSid;

      if (useTwilio) {
        // Use Twilio SMS
        try {
          const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

          const verification = await twilioClient.verify.v2
            .services(twilioVerifyServiceSid)
            .verifications.create({
              to: userPhone,
              channel: 'sms'
            });

          // Store identifier for verification (use email for session later)
          return NextResponse.json({
            success: true,
            message: 'Verification code sent to your mobile number via SMS',
            type: 'sms',
            identifier: userPhone,
            userEmail: userEmail, // Store email for session creation
            smsStatus: 'sent'
          });

        } catch (twilioError: any) {
          // Fallback to database OTP
          const otp = generateMobileOTP();
          const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

          await SupabaseMobileOTPStore.set(userPhone, {
            user_id: user?.id || null,
            mobile: userPhone,
            otp,
            expires_at: expiresAt,
            verified: false
          });

          return NextResponse.json({
            success: true,
            message: 'Verification code generated (SMS delivery may be delayed)',
            type: 'sms',
            identifier: userPhone,
            userEmail: userEmail,
            devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
            smsStatus: 'fallback',
            twilioError: twilioError.message
          });
        }
      } else {
        // No Twilio configured, use database OTP
        const otp = generateMobileOTP();
        const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

        await SupabaseMobileOTPStore.set(userPhone, {
          user_id: user?.id || null,
          mobile: userPhone,
          otp,
          expires_at: expiresAt,
          verified: false
        });

        return NextResponse.json({
          success: true,
          message: 'Verification code generated (SMS not configured)',
          type: 'sms',
          identifier: userPhone,
          userEmail: userEmail,
          devOtp: otp, // Always show for debugging
          smsStatus: 'database',
          twilioConfigured: false
        });
      }
    }

    // ==================== EMAIL LOGIN ====================
    if (isEmail && userEmail) {
      // Check if SMTP is configured
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpUser || !smtpPass) {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 503 }
        );
      }

      // Generate OTP
      const otp = generateEmailOTP();
      const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

      // Store OTP in Supabase
      const stored = await SupabaseEmailOTPStore.set(userEmail, {
        user_id: user?.id || null,
        email: userEmail,
        otp,
        expires_at: expiresAt,
        verified: false
      });

      if (!stored) {
        console.error('Failed to store OTP in database');
        return NextResponse.json(
          { error: 'Failed to store verification code' },
          { status: 500 }
        );
      }

      // Send email OTP
      let emailSent = false;
      let emailError = null;

      try {
        const emailResult = await sendOTPEmail({
          to: userEmail,
          otp,
          expiresInMinutes: 10
        });

        if (!emailResult.success) {
          emailError = emailResult.error;
          if (process.env.NODE_ENV === 'production') {
            throw new Error(emailResult.error);
          }
        } else {
          emailSent = true;
        }
      } catch (error) {
        emailError = error instanceof Error ? error.message : String(error);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Failed to send verification email', details: emailError },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: emailSent ? 'Verification code sent to your email' : 'OTP generated (email failed to send)',
        type: 'email',
        identifier: userEmail,
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
        emailSent,
        emailError: process.env.NODE_ENV === 'development' ? emailError : undefined
      });
    }

    // Should never reach here
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  } finally {
    // Always release the lock
    if (identifier) {
      releaseLock(identifier);
    }
  }
}

export async function GET() {
  // For development - show current OTPs
  if (process.env.NODE_ENV === 'development') {
    const records = await SupabaseEmailOTPStore.getAllForDev();
    const currentOTPs = records.map((record) => ({
      email: record.email,
      otp: record.otp,
      expiresAt: record.expires_at,
      expired: new Date() > new Date(record.expires_at),
      verified: record.verified
    }));

    return NextResponse.json({ otps: currentOTPs });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
