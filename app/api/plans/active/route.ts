import { NextRequest, NextResponse } from 'next/server';
import { SupabasePlansStore } from '@/lib/supabase-plans-store';

// GET - Fetch active plans for public use (product selection page)
export async function GET(request: NextRequest) {
  try {
    const plans = await SupabasePlansStore.getActive();

    return NextResponse.json({
      plans,
      success: true
    });
  } catch (error) {
    console.error('Error fetching active plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
