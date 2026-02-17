import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCardCustomizationStore } from '@/lib/supabase-card-customization-store';

// GET - Fetch enabled card customization options (public API for configure page)
// Optional: ?plan_type=physical-digital to get plan-specific options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planType = searchParams.get('plan_type');

    let structuredOptions;

    // Valid plan types that support card customization
    const validPlanTypes = ['physical-digital', 'founders-club', 'signature', 'pro', 'founders-circle'];

    // If plan_type is provided and valid, return plan-specific options
    if (planType && validPlanTypes.includes(planType)) {
      structuredOptions = await SupabaseCardCustomizationStore.getStructuredOptionsForPlan(planType);
    } else {
      // Default: return all enabled options (backward compatible)
      structuredOptions = await SupabaseCardCustomizationStore.getStructuredOptions(true);
    }

    return NextResponse.json({
      ...structuredOptions,
      planType: planType || 'all',
      success: true
    });
  } catch (error) {
    console.error('Error fetching card customization options:', error);

    // Return fallback hardcoded options if database fails
    const fallbackOptions = getFallbackOptions();

    return NextResponse.json({
      ...fallbackOptions,
      success: true,
      fallback: true
    });
  }
}

// Fallback options in case database is unavailable
function getFallbackOptions() {
  const materials = [
    { id: 'fallback-pvc', category: 'material', option_key: 'pvc', label: 'PVC', description: 'Lightweight and affordable', price: 69, is_enabled: true, is_founders_only: false, display_order: 1 },
    { id: 'fallback-wood', category: 'material', option_key: 'wood', label: 'Wood', description: 'Natural and sustainable', price: 79, is_enabled: true, is_founders_only: false, display_order: 2 },
    { id: 'fallback-metal', category: 'material', option_key: 'metal', label: 'Metal', description: 'Premium and durable', price: 99, is_enabled: true, is_founders_only: false, display_order: 3 }
  ];

  const textures = [
    { id: 'fallback-matte', category: 'texture', option_key: 'matte', label: 'Matte', applicable_materials: ['pvc', 'metal'], is_enabled: true, display_order: 1 },
    { id: 'fallback-glossy', category: 'texture', option_key: 'glossy', label: 'Glossy', applicable_materials: ['pvc'], is_enabled: true, display_order: 2 },
    { id: 'fallback-brushed', category: 'texture', option_key: 'brushed', label: 'Brushed', applicable_materials: ['metal'], is_enabled: true, display_order: 3 },
    { id: 'fallback-none', category: 'texture', option_key: 'none', label: 'Natural', applicable_materials: ['wood'], is_enabled: true, display_order: 4 }
  ];

  const colours = [
    { id: 'fallback-white', category: 'colour', option_key: 'white', label: 'White', hex_color: '#FFFFFF', gradient_class: 'from-white to-gray-100', applicable_materials: ['pvc'], is_founders_only: false, is_enabled: true, display_order: 1 },
    { id: 'fallback-black-pvc', category: 'colour', option_key: 'black-pvc', label: 'Black', hex_color: '#1A1A1A', gradient_class: 'from-gray-900 to-black', applicable_materials: ['pvc'], is_founders_only: true, is_enabled: true, display_order: 2 },
    { id: 'fallback-cherry', category: 'colour', option_key: 'cherry', label: 'Cherry', hex_color: '#8E3A2D', gradient_class: 'from-red-950 to-red-900', applicable_materials: ['wood'], is_founders_only: false, is_enabled: true, display_order: 3 },
    { id: 'fallback-birch', category: 'colour', option_key: 'birch', label: 'Birch', hex_color: '#E5C79F', gradient_class: 'from-amber-100 to-amber-200', applicable_materials: ['wood'], is_founders_only: false, is_enabled: true, display_order: 4 },
    { id: 'fallback-black-metal', category: 'colour', option_key: 'black-metal', label: 'Black', hex_color: '#1A1A1A', gradient_class: 'from-gray-800 to-gray-900', applicable_materials: ['metal'], is_founders_only: true, is_enabled: true, display_order: 5 },
    { id: 'fallback-silver', category: 'colour', option_key: 'silver', label: 'Silver', hex_color: '#C0C0C0', gradient_class: 'from-gray-300 to-gray-400', applicable_materials: ['metal'], is_founders_only: false, is_enabled: true, display_order: 6 },
    { id: 'fallback-rose-gold', category: 'colour', option_key: 'rose-gold', label: 'Rose Gold', hex_color: '#B76E79', gradient_class: 'from-rose-300 to-rose-400', applicable_materials: ['metal'], is_founders_only: false, is_enabled: true, display_order: 7 }
  ];

  const patterns = [
    { id: 'fallback-geometric', category: 'pattern', option_key: 'geometric', label: 'Geometric', is_enabled: true, display_order: 1 },
    { id: 'fallback-minimalist', category: 'pattern', option_key: 'minimalist', label: 'Minimalist', is_enabled: true, display_order: 2 },
    { id: 'fallback-abstract', category: 'pattern', option_key: 'abstract', label: 'Abstract', is_enabled: true, display_order: 3 }
  ];

  const materialPrices: Record<string, number> = { pvc: 69, wood: 79, metal: 99 };
  const textureOptions: Record<string, string[]> = {
    pvc: ['matte', 'glossy'],
    wood: ['none'],
    metal: ['matte', 'brushed']
  };
  const colourOptions: Record<string, string[]> = {
    pvc: ['white', 'black-pvc'],
    wood: ['cherry', 'birch'],
    metal: ['black-metal', 'silver', 'rose-gold']
  };

  return {
    materials,
    textures,
    colours,
    patterns,
    materialPrices,
    textureOptions,
    colourOptions
  };
}
