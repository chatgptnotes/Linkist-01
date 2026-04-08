import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';

// Development/debug endpoint - Check environment config presence
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

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    hasSmtpHost: Boolean(process.env.SMTP_HOST),
    hasSmtpPort: Boolean(process.env.SMTP_PORT),
    hasSmtpUser: Boolean(process.env.SMTP_USER),
    hasSmtpPass: Boolean(process.env.SMTP_PASS),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
  });
}
