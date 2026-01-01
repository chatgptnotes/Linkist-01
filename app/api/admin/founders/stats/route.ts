import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Get request counts by status
    const { data: requests, error: requestsError } = await supabase
      .from('founders_requests')
      .select('status');

    if (requestsError) {
      console.error('Error fetching requests stats:', requestsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Get invite code stats
    const { data: codes, error: codesError } = await supabase
      .from('founders_invite_codes')
      .select('expires_at, used_at');

    if (codesError) {
      console.error('Error fetching codes stats:', codesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch code stats' },
        { status: 500 }
      );
    }

    // Calculate request stats
    const total = requests?.length || 0;
    const pending = requests?.filter(r => r.status === 'pending').length || 0;
    const approved = requests?.filter(r => r.status === 'approved').length || 0;
    const rejected = requests?.filter(r => r.status === 'rejected').length || 0;

    // Calculate code stats
    const now = new Date();
    const usedInvites = codes?.filter(c => c.used_at).length || 0;
    const expiredInvites = codes?.filter(c => !c.used_at && new Date(c.expires_at) < now).length || 0;
    const activeInvites = codes?.filter(c => !c.used_at && new Date(c.expires_at) >= now).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        activeInvites,
        usedInvites,
        expiredInvites
      }
    });

  } catch (error) {
    console.error('Error in founders stats API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
