import { NextRequest, NextResponse } from 'next/server';
import { SupabasePlansStore } from '@/lib/supabase-plans-store';
import { getCurrentUser } from '@/lib/auth-middleware';

// GET - Fetch all plans
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const plans = await SupabasePlansStore.getAll();
    const stats = await SupabasePlansStore.getStats();

    return NextResponse.json({
      plans,
      stats,
      success: true
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, price, monthly_price, yearly_price, yearly_discount_percent, has_card_customization, gst_percentage, vat_percentage, description, features, status, popular, allowed_countries, founders_total_price } = body;

    // Validation
    if (!name || !type || price === undefined || price === null || !description || !features) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['physical-digital', 'digital-with-app', 'digital-only', 'founders-club', 'starter', 'next', 'pro', 'signature', 'founders-circle'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: 'Features must be a non-empty array' },
        { status: 400 }
      );
    }

    const plan = await SupabasePlansStore.create({
      name,
      type,
      price,
      monthly_price: monthly_price ?? null,
      yearly_price: yearly_price ?? null,
      yearly_discount_percent: yearly_discount_percent ?? null,
      has_card_customization: has_card_customization ?? false,
      gst_percentage: gst_percentage || 18,
      vat_percentage: vat_percentage || 5,
      description,
      features,
      status: status || 'draft',
      popular: popular || false,
      allowed_countries: allowed_countries || ['India', 'UAE', 'USA', 'UK'],
      founders_total_price: type === 'founders-club' ? founders_total_price : null
    });

    return NextResponse.json({
      plan,
      success: true,
      message: 'Plan created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

// PUT - Update plan
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const existingPlan = await SupabasePlansStore.getById(id);
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (updateData.type && !['physical-digital', 'digital-with-app', 'digital-only', 'founders-club', 'starter', 'next', 'pro', 'signature', 'founders-circle'].includes(updateData.type)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Validate features if provided
    if (updateData.features !== undefined && (!Array.isArray(updateData.features) || updateData.features.length === 0)) {
      return NextResponse.json(
        { error: 'Features must be a non-empty array' },
        { status: 400 }
      );
    }

    const updatedPlan = await SupabasePlansStore.update(id, updateData);

    return NextResponse.json({
      plan: updatedPlan,
      success: true,
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const existingPlan = await SupabasePlansStore.getById(id);
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    await SupabasePlansStore.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
