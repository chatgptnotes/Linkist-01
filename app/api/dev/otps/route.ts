import { NextRequest, NextResponse } from 'next/server';
import { SupabaseEmailOTPStore, SupabaseMobileOTPStore } from '@/lib/supabase-otp-store';
import { getCurrentUser } from '@/lib/auth-middleware';

// Development/debug endpoint - View all active OTPs
// Requires BOTH: ENABLE_DEV_ROUTES=true AND authenticated super_admin session
export async function GET(request: NextRequest) {
  if (process.env.ENABLE_DEV_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const session = await getCurrentUser(request);
  const userRole = session.user?.db_role_name || session.user?.role;
  if (!session.isAuthenticated || userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
  }

  try {
    const emailOtps = await SupabaseEmailOTPStore.getAllForDev();
    const mobileOtps = await SupabaseMobileOTPStore.getAllForDev();

    const now = new Date();

    return NextResponse.json({
      timestamp: now.toISOString(),
      emailOTPs: emailOtps.map(record => ({
        email: record.email,
        otp: record.otp,
        expiresAt: record.expires_at,
        expired: new Date(record.expires_at) < now,
        verified: record.verified
      })),
      mobileOTPs: mobileOtps.map(record => ({
        mobile: record.mobile,
        otp: record.otp,
        expiresAt: record.expires_at,
        expired: new Date(record.expires_at) < now,
        verified: record.verified
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching OTPs:', error);
    return NextResponse.json({ error: 'Failed to fetch OTPs' }, { status: 500 });
  }
}
