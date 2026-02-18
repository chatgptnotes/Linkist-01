import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCardCustomizationStore } from '@/lib/supabase-card-customization-store';
import { getCurrentUser } from '@/lib/auth-middleware';

// GET - Fetch all card customization options (admin view)
// Optional: ?plan_id=xxx&material=pvc to get plan-specific options with material context for colours
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

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');
    const selectedMaterial = searchParams.get('material') || undefined;

    // If plan_id is provided, return plan-specific options
    if (planId) {
      const options = await SupabaseCardCustomizationStore.getAllOptionsWithPlanStatus(planId, selectedMaterial);

      // Group by category for easier frontend consumption
      const grouped = {
        materials: options.filter(o => o.category === 'material'),
        textures: options.filter(o => o.category === 'texture'),
        colours: options.filter(o => o.category === 'colour'),
        patterns: options.filter(o => o.category === 'pattern')
      };

      return NextResponse.json({
        options,
        grouped,
        planId,
        selectedMaterial,
        success: true
      });
    }

    // Default: return all options (global view)
    const options = await SupabaseCardCustomizationStore.getAll();

    // Group by category for easier frontend consumption
    const grouped = {
      materials: options.filter(o => o.category === 'material'),
      textures: options.filter(o => o.category === 'texture'),
      colours: options.filter(o => o.category === 'colour'),
      patterns: options.filter(o => o.category === 'pattern')
    };

    // Also fetch subscription plans for the dropdown
    const plans = await SupabaseCardCustomizationStore.getSubscriptionPlans();

    return NextResponse.json({
      options,
      grouped,
      plans,
      success: true
    });
  } catch (error) {
    console.error('Error fetching card customization options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card customization options' },
      { status: 500 }
    );
  }
}

// PUT - Update an option (toggle enabled, update price, etc.)
// For plan-specific updates, include plan_id in the body
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
    const { id, action, plan_id, material_key, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      );
    }

    // Check if option exists
    const existingOption = await SupabaseCardCustomizationStore.getById(id);
    if (!existingOption) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      );
    }

    let updatedOption;

    // Handle plan-specific toggle
    // For colours, material_key specifies which material to toggle for
    if (plan_id && action === 'togglePlan') {
      updatedOption = await SupabaseCardCustomizationStore.togglePlanOption(plan_id, id, material_key);
      return NextResponse.json({
        planOption: updatedOption,
        success: true,
        message: 'Plan option updated successfully'
      });
    }

    // Handle global actions (for backward compatibility)
    if (action === 'toggle') {
      updatedOption = await SupabaseCardCustomizationStore.toggleEnabled(id);
    } else if (action === 'updatePrice') {
      const { price } = updateData;
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json(
          { error: 'Invalid price. Must be a non-negative number.' },
          { status: 400 }
        );
      }
      if (existingOption.category !== 'material') {
        return NextResponse.json(
          { error: 'Price can only be updated for materials' },
          { status: 400 }
        );
      }
      updatedOption = await SupabaseCardCustomizationStore.updatePrice(id, price);
    } else {
      // General update
      updatedOption = await SupabaseCardCustomizationStore.update(id, updateData);
    }

    return NextResponse.json({
      option: updatedOption,
      success: true,
      message: 'Option updated successfully'
    });
  } catch (error) {
    console.error('Error updating card customization option:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update option: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PATCH - Batch update multiple options (e.g., reorder)
export async function PATCH(request: NextRequest) {
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
    const { action, plan_id, toggles, updates } = body;

    // Batch toggle plan options (Save All)
    if (action === 'batchToggle' && plan_id && Array.isArray(toggles)) {
      if (toggles.length === 0) {
        return NextResponse.json(
          { error: 'No toggles to update' },
          { status: 400 }
        );
      }

      const updated = await SupabaseCardCustomizationStore.batchSetPlanOptions(plan_id, toggles);
      return NextResponse.json({
        updated,
        success: true,
        message: `${updated} options updated successfully`
      });
    }

    // Legacy: batch update (reorder etc.)
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    const results = [];
    for (const update of updates) {
      const { id, ...data } = update;
      if (id) {
        const result = await SupabaseCardCustomizationStore.update(id, data);
        results.push(result);
      }
    }

    return NextResponse.json({
      updated: results.length,
      success: true,
      message: `${results.length} options updated successfully`
    });
  } catch (error) {
    console.error('Error batch updating options:', error);
    return NextResponse.json(
      { error: 'Failed to batch update options' },
      { status: 500 }
    );
  }
}
