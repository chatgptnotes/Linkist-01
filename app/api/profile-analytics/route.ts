import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable caching for dynamic data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Fetch total profile views
    const { data: viewsData, error: viewsError } = await supabase
      .from('profile_views')
      .select('*')
      .eq('profile_email', email);

    if (viewsError) {
      console.error('Error fetching profile views:', viewsError);
    }

    // Fetch unique views (count distinct viewer_ip)
    const { data: uniqueViewsData, error: uniqueViewsError } = await supabase
      .from('profile_views')
      .select('viewer_ip')
      .eq('profile_email', email);

    if (uniqueViewsError) {
      console.error('Error fetching unique views:', uniqueViewsError);
    }

    const uniqueViewers = uniqueViewsData
      ? new Set(uniqueViewsData.map(v => v.viewer_ip).filter(Boolean)).size
      : 0;

    // Fetch engagement events
    const { data: engagementData, error: engagementError } = await supabase
      .from('engagement_events')
      .select('*')
      .eq('profile_email', email);

    if (engagementError) {
      console.error('Error fetching engagement events:', engagementError);
    }

    // Count engagement by type
    const whatsappEngagement = engagementData?.filter(e =>
      e.event_type === 'whatsapp' || e.event_type === 'whatsapp_click'
    ).length || 0;

    const emailEngagement = engagementData?.filter(e =>
      e.event_type === 'email' || e.event_type === 'email_click'
    ).length || 0;

    const socialMediaEngagement = engagementData?.filter(e =>
      ['linkedin', 'instagram', 'facebook', 'twitter', 'github',
       'youtube', 'behance', 'dribbble', 'tiktok'].includes(e.event_type)
    ).length || 0;

    // If no data exists yet, return zero values instead of dummy data
    const analytics = {
      totalViews: viewsData?.length || 0,
      uniqueViews: uniqueViewers,
      whatsappEngagement,
      emailEngagement,
      socialMediaEngagement,
      recentViews: viewsData?.slice(-10).reverse() || [], // Last 10 views
      recentEngagements: engagementData?.slice(-10).reverse() || [], // Last 10 engagements
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Profile analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profile analytics data'
      },
      { status: 500 }
    );
  }
}
