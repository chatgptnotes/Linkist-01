import { NextRequest, NextResponse } from 'next/server';
import { SupabasePlansStore } from '@/lib/supabase-plans-store';
import { calculateFoundersPricing } from '@/lib/pricing-utils';

/**
 * GET /api/founders/pricing
 * Returns the Founders Club pricing configuration
 * Optionally calculates the breakdown based on user's country
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'India';

    // Get all plans and find the founders-club plan
    const plans = await SupabasePlansStore.getAll();
    const foundersPlan = plans.find(p => p.type === 'founders-club' && p.status === 'active');

    if (!foundersPlan) {
      return NextResponse.json({
        success: false,
        error: 'Founders Club plan not found or not active'
      }, { status: 404 });
    }

    const totalPrice = foundersPlan.founders_total_price;

    if (!totalPrice) {
      return NextResponse.json({
        success: false,
        error: 'Founders Club total price not configured'
      }, { status: 404 });
    }

    // Calculate pricing breakdown based on country
    const pricing = calculateFoundersPricing(totalPrice, country);

    return NextResponse.json({
      success: true,
      founders_total_price: totalPrice,
      pricing: {
        basePrice: pricing.basePrice,
        taxAmount: pricing.taxAmount,
        taxRate: pricing.taxRate,
        taxLabel: pricing.taxLabel,
        total: pricing.total
      },
      plan: {
        id: foundersPlan.id,
        name: foundersPlan.name,
        description: foundersPlan.description,
        features: foundersPlan.features
      }
    });
  } catch (error) {
    console.error('Error fetching founders pricing:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch founders pricing'
    }, { status: 500 });
  }
}
