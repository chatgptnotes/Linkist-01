import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client with service role key for full access
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export type OptionCategory = 'material' | 'texture' | 'colour' | 'pattern';

export interface CardCustomizationOption {
  id: string;
  category: OptionCategory;
  option_key: string;
  label: string;
  description: string | null;
  hex_color: string | null;
  gradient_class: string | null;
  price: number | null;
  applicable_materials: string[] | null;
  is_enabled: boolean;
  is_founders_only: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateOptionData {
  is_enabled?: boolean;
  price?: number;
  description?: string;
  display_order?: number;
}

export interface PlanCustomizationOption {
  id: string;
  plan_id: string;
  option_id: string;
  is_enabled: boolean;
  price_override: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields from card_customization_options
  option?: CardCustomizationOption;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club';
  price: number;
  description: string;
  status: string;
}

export interface UpdatePlanOptionData {
  is_enabled?: boolean;
  price_override?: number | null;
}

// Structured options for the configure page
export interface StructuredCustomizationOptions {
  materials: CardCustomizationOption[];
  textures: CardCustomizationOption[];
  colours: CardCustomizationOption[];
  patterns: CardCustomizationOption[];
  materialPrices: Record<string, number>;
  textureOptions: Record<string, string[]>;
  colourOptions: Record<string, string[]>;
}

export const SupabaseCardCustomizationStore = {
  /**
   * Get all options (for admin use)
   */
  async getAll(): Promise<CardCustomizationOption[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('card_customization_options')
      .select('*')
      .order('category')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching card customization options:', error);
      throw new Error(`Failed to fetch options: ${error.message}`);
    }

    return data as CardCustomizationOption[];
  },

  /**
   * Get enabled options only (for public use on configure page)
   */
  async getEnabled(): Promise<CardCustomizationOption[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('is_enabled', true)
      .order('category')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching enabled options:', error);
      throw new Error(`Failed to fetch enabled options: ${error.message}`);
    }

    return data as CardCustomizationOption[];
  },

  /**
   * Get options by category
   */
  async getByCategory(category: OptionCategory): Promise<CardCustomizationOption[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('category', category)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(`Error fetching ${category} options:`, error);
      throw new Error(`Failed to fetch ${category} options: ${error.message}`);
    }

    return data as CardCustomizationOption[];
  },

  /**
   * Get single option by ID
   */
  async getById(id: string): Promise<CardCustomizationOption | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching option:', error);
      throw new Error(`Failed to fetch option: ${error.message}`);
    }

    return data as CardCustomizationOption;
  },

  /**
   * Update an option (enable/disable, price, etc.)
   */
  async update(id: string, updateData: UpdateOptionData): Promise<CardCustomizationOption> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('card_customization_options')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating option:', error);
      throw new Error(`Failed to update option: ${error.message}`);
    }

    return data as CardCustomizationOption;
  },

  /**
   * Toggle enabled state
   */
  async toggleEnabled(id: string): Promise<CardCustomizationOption> {
    const option = await this.getById(id);
    if (!option) {
      throw new Error('Option not found');
    }

    return this.update(id, { is_enabled: !option.is_enabled });
  },

  /**
   * Update price (for materials)
   */
  async updatePrice(id: string, price: number): Promise<CardCustomizationOption> {
    return this.update(id, { price });
  },

  /**
   * Get structured options for the configure page
   */
  async getStructuredOptions(enabledOnly: boolean = true): Promise<StructuredCustomizationOptions> {
    const options = enabledOnly ? await this.getEnabled() : await this.getAll();

    const materials = options.filter(o => o.category === 'material');
    const textures = options.filter(o => o.category === 'texture');
    const colours = options.filter(o => o.category === 'colour');
    const patterns = options.filter(o => o.category === 'pattern');

    // Build material prices map
    const materialPrices: Record<string, number> = {};
    materials.forEach(m => {
      if (m.price !== null) {
        materialPrices[m.option_key] = m.price;
      }
    });

    // Build texture options map (material -> textures)
    const textureOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      textureOptions[m.option_key] = textures
        .filter(t => t.applicable_materials?.includes(m.option_key))
        .map(t => t.option_key);
    });

    // Build colour options map (material -> colours)
    const colourOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      colourOptions[m.option_key] = colours
        .filter(c => c.applicable_materials?.includes(m.option_key))
        .map(c => c.option_key);
    });

    return {
      materials,
      textures,
      colours,
      patterns,
      materialPrices,
      textureOptions,
      colourOptions
    };
  },

  // ============================================
  // Plan-specific methods
  // ============================================

  /**
   * Get all subscription plans (for admin dropdown, excluding digital-only)
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name, type, price, description, status')
      .in('type', ['physical-digital', 'founders-club'])
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error(`Failed to fetch subscription plans: ${error.message}`);
    }

    return data as SubscriptionPlan[];
  },

  /**
   * Get plan-option mappings for a specific plan (for admin UI)
   */
  async getPlanOptionMappings(planId: string): Promise<PlanCustomizationOption[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('plan_customization_options')
      .select(`
        *,
        option:card_customization_options(*)
      `)
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching plan option mappings:', error);
      throw new Error(`Failed to fetch plan option mappings: ${error.message}`);
    }

    return data as PlanCustomizationOption[];
  },

  /**
   * Get enabled options for a specific plan type (for public configure page)
   */
  async getOptionsForPlanType(planType: string): Promise<CardCustomizationOption[]> {
    const supabase = getAdminClient();

    // First get the plan ID for this type
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('type', planType)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      // Fall back to all enabled options
      return this.getEnabled();
    }

    // Get enabled options for this plan
    const { data, error } = await supabase
      .from('plan_customization_options')
      .select(`
        option:card_customization_options(*)
      `)
      .eq('plan_id', plan.id)
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching plan options:', error);
      // Fall back to all enabled options
      return this.getEnabled();
    }

    // Extract the option objects and filter out nulls
    // The join returns an array for the nested relation, but we want single objects
    const options: CardCustomizationOption[] = [];
    for (const item of data) {
      const option = item.option;
      if (option && typeof option === 'object' && !Array.isArray(option)) {
        options.push(option as CardCustomizationOption);
      } else if (Array.isArray(option) && option.length > 0) {
        options.push(option[0] as CardCustomizationOption);
      }
    }

    return options;
  },

  /**
   * Get structured options for a specific plan type (for configure page)
   */
  async getStructuredOptionsForPlan(planType: string): Promise<StructuredCustomizationOptions> {
    const options = await this.getOptionsForPlanType(planType);

    const materials = options.filter(o => o.category === 'material');
    const textures = options.filter(o => o.category === 'texture');
    const colours = options.filter(o => o.category === 'colour');
    const patterns = options.filter(o => o.category === 'pattern');

    // Build material prices map
    const materialPrices: Record<string, number> = {};
    materials.forEach(m => {
      if (m.price !== null) {
        materialPrices[m.option_key] = m.price;
      }
    });

    // Build texture options map (material -> textures)
    const textureOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      textureOptions[m.option_key] = textures
        .filter(t => t.applicable_materials?.includes(m.option_key))
        .map(t => t.option_key);
    });

    // Build colour options map (material -> colours)
    const colourOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      colourOptions[m.option_key] = colours
        .filter(c => c.applicable_materials?.includes(m.option_key))
        .map(c => c.option_key);
    });

    return {
      materials,
      textures,
      colours,
      patterns,
      materialPrices,
      textureOptions,
      colourOptions
    };
  },

  /**
   * Update a plan-option mapping (enable/disable option for a plan)
   */
  async updatePlanOption(planId: string, optionId: string, updateData: UpdatePlanOptionData): Promise<PlanCustomizationOption> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('plan_customization_options')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('plan_id', planId)
      .eq('option_id', optionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan option:', error);
      throw new Error(`Failed to update plan option: ${error.message}`);
    }

    return data as PlanCustomizationOption;
  },

  /**
   * Toggle enabled state for a plan-option mapping
   */
  async togglePlanOption(planId: string, optionId: string): Promise<PlanCustomizationOption> {
    const supabase = getAdminClient();

    // First get the current state
    const { data: current, error: fetchError } = await supabase
      .from('plan_customization_options')
      .select('is_enabled')
      .eq('plan_id', planId)
      .eq('option_id', optionId)
      .single();

    if (fetchError) {
      console.error('Error fetching plan option:', fetchError);
      throw new Error(`Failed to fetch plan option: ${fetchError.message}`);
    }

    // Toggle the state
    return this.updatePlanOption(planId, optionId, { is_enabled: !current.is_enabled });
  },

  /**
   * Get all options with plan-specific enabled status for admin view
   */
  async getAllOptionsWithPlanStatus(planId: string): Promise<(CardCustomizationOption & { plan_enabled: boolean })[]> {
    const supabase = getAdminClient();

    // Get all options
    const allOptions = await this.getAll();

    // Get plan-specific settings
    const { data: planOptions, error } = await supabase
      .from('plan_customization_options')
      .select('option_id, is_enabled')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching plan options:', error);
      throw new Error(`Failed to fetch plan options: ${error.message}`);
    }

    // Create a map of option_id -> is_enabled
    const planOptionMap = new Map<string, boolean>();
    planOptions?.forEach(po => {
      planOptionMap.set(po.option_id, po.is_enabled);
    });

    // Merge the data
    return allOptions.map(option => ({
      ...option,
      plan_enabled: planOptionMap.get(option.id) ?? false
    }));
  }
};
