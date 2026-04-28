import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import { RBAC } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authSession = await getCurrentUser(request);

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { error: 'Not authenticated', isAuthenticated: false },
        { status: 401 }
      );
    }

    const user = authSession.user;

    // Get user permissions for frontend use
    const permissions = RBAC.getUserPermissions(user);
    const canAccessAdmin = RBAC.canAccessAdmin(user);

    // Founder's Circle gating is single-sourced from `users.founding_member_plan`,
    // which is only stamped after a verified payment in app/api/process-order/route.ts.
    // We no longer need to scan orders here.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const profileResult = await Promise.resolve(
      supabase
        .from('profiles')
        .select('custom_url')
        .eq('email', user.email)
        .not('custom_url', 'is', null)
        .maybeSingle()
    ).then(r => r.data).catch(() => null);

    const hasClaimedUrl = !!profileResult?.custom_url;
    const claimedUsername = profileResult?.custom_url || null;

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number || null,
        email_verified: user.email_verified,
        mobile_verified: user.mobile_verified,
        role: user.role,
        db_role_name: (user as any).db_role_name || user.role,
        db_permissions: permissions,
        created_at: user.created_at,
        is_founding_member: user.is_founding_member || false,
        founding_member_since: user.founding_member_since || null,
        founding_member_plan: user.founding_member_plan || null,
        has_claimed_url: hasClaimedUrl,
        claimed_username: claimedUsername
      },
      permissions,
      canAccessAdmin,
      isAdmin: RBAC.isAdmin(user),
      isModerator: RBAC.isModerator(user)
    });

  } catch (error) {
    console.error('❌ /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isAuthenticated: false },
      { status: 500 }
    );
  }
}