import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import { RBAC } from '@/lib/rbac';
import { SupabaseOrderStore } from '@/lib/supabase-order-store';
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

    // Check if user actually has a Founder's Club/Circle order
    let hasFoundersOrder = false;
    if (user.is_founding_member) {
      try {
        const orders = await SupabaseOrderStore.getByEmail(user.email);
        hasFoundersOrder = orders.some(order => {
          const planType = (order.cardConfig as any)?.planType;
          return planType === 'founders-club' || planType === 'founders-circle';
        });
      } catch {
        // Non-fatal - default to false
      }
    }

    // Check if user has already claimed a URL (has a profile with custom_url)
    let hasClaimedUrl = false;
    let claimedUsername: string | null = null;
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: profile } = await supabase
        .from('profiles')
        .select('custom_url')
        .eq('email', user.email)
        .not('custom_url', 'is', null)
        .maybeSingle();

      if (profile?.custom_url) {
        hasClaimedUrl = true;
        claimedUsername = profile.custom_url;
      }
    } catch {
      // Non-fatal - default to false
    }

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
        created_at: user.created_at,
        is_founding_member: user.is_founding_member || false,
        has_founders_order: hasFoundersOrder,
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