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
  material_key: string | null;  // For colours: which material this applies to
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
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club' | 'signature' | 'pro' | 'founders-circle' | 'starter' | 'next';
  price: number;
  description: string;
  status: string;
}

export interface UpdatePlanOptionData {
  is_enabled?: boolean;
  price_override?: number | null;
  material_key?: string | null;
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
      .in('type', ['physical-digital', 'founders-club', 'signature', 'pro', 'founders-circle'])
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
   * Now returns material-specific colour options
   */
  async getStructuredOptionsForPlan(planType: string): Promise<StructuredCustomizationOptions> {
    const supabase = getAdminClient();

    // Get the plan ID for this type
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('type', planType)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      // Fall back to all enabled options
      return this.getStructuredOptions(true);
    }

    // Get enabled materials only (material_key is NULL for materials)
    const { data: globalOptions, error: optError } = await supabase
      .from('plan_customization_options')
      .select(`
        option:card_customization_options(*)
      `)
      .eq('plan_id', plan.id)
      .eq('is_enabled', true)
      .is('material_key', null);

    if (optError) {
      console.error('Error fetching global options:', optError);
      return this.getStructuredOptions(true);
    }

    // Extract the option objects
    const enabledGlobalOptions: CardCustomizationOption[] = [];
    for (const item of globalOptions || []) {
      const option = item.option;
      if (option && typeof option === 'object' && !Array.isArray(option)) {
        enabledGlobalOptions.push(option as CardCustomizationOption);
      } else if (Array.isArray(option) && option.length > 0) {
        enabledGlobalOptions.push(option[0] as CardCustomizationOption);
      }
    }

    const materials = enabledGlobalOptions.filter(o => o.category === 'material');

    // Get all textures (we'll filter by material later, like colours)
    const { data: allTexturesData } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('category', 'texture')
      .eq('is_enabled', true);

    const allTextures = (allTexturesData || []) as CardCustomizationOption[];

    // Get all colours (we'll filter by material later)
    const { data: allColoursData } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('category', 'colour')
      .eq('is_enabled', true);

    const allColours = (allColoursData || []) as CardCustomizationOption[];

    // Get all patterns (we'll filter by material later)
    const { data: allPatternsData } = await supabase
      .from('card_customization_options')
      .select('*')
      .eq('category', 'pattern')
      .eq('is_enabled', true);

    const allPatterns = (allPatternsData || []) as CardCustomizationOption[];

    // Get material-specific enabled status (for colours, textures, and patterns)
    const { data: materialSpecificStatus, error: statusError } = await supabase
      .from('plan_customization_options')
      .select('option_id, material_key, is_enabled')
      .eq('plan_id', plan.id)
      .not('material_key', 'is', null);

    if (statusError) {
      console.error('Error fetching material-specific status:', statusError);
    }

    // Build status maps: material_key -> [enabled option_ids]
    // Separate maps for colours, textures, and patterns
    const colourStatusMap = new Map<string, Set<string>>();
    const textureStatusMap = new Map<string, Set<string>>();
    const patternStatusMap = new Map<string, Set<string>>();

    // Get colour, texture, and pattern IDs for categorization
    const colourIds = new Set(allColours.map(c => c.id));
    const textureIds = new Set(allTextures.map(t => t.id));
    const patternIds = new Set(allPatterns.map(p => p.id));

    (materialSpecificStatus || []).forEach(item => {
      if (item.is_enabled && item.material_key) {
        if (colourIds.has(item.option_id)) {
          if (!colourStatusMap.has(item.material_key)) {
            colourStatusMap.set(item.material_key, new Set());
          }
          colourStatusMap.get(item.material_key)!.add(item.option_id);
        } else if (textureIds.has(item.option_id)) {
          if (!textureStatusMap.has(item.material_key)) {
            textureStatusMap.set(item.material_key, new Set());
          }
          textureStatusMap.get(item.material_key)!.add(item.option_id);
        } else if (patternIds.has(item.option_id)) {
          if (!patternStatusMap.has(item.material_key)) {
            patternStatusMap.set(item.material_key, new Set());
          }
          patternStatusMap.get(item.material_key)!.add(item.option_id);
        }
      }
    });

    // Build material prices map
    const materialPrices: Record<string, number> = {};
    materials.forEach(m => {
      if (m.price !== null) {
        materialPrices[m.option_key] = m.price;
      }
    });

    // Build texture options map (material -> enabled textures for that material)
    const textureOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      const enabledTextureIds = textureStatusMap.get(m.option_key) || new Set();
      textureOptions[m.option_key] = allTextures
        .filter(t => enabledTextureIds.has(t.id))
        .map(t => t.option_key);
    });

    // Build colour options map (material -> enabled colours for that material)
    const colourOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      const enabledColourIds = colourStatusMap.get(m.option_key) || new Set();
      colourOptions[m.option_key] = allColours
        .filter(c => enabledColourIds.has(c.id))
        .map(c => c.option_key);
    });

    // Get the textures that are enabled for at least one material
    const enabledTextureIds = new Set<string>();
    textureStatusMap.forEach(ids => ids.forEach(id => enabledTextureIds.add(id)));
    const textures = allTextures.filter(t => enabledTextureIds.has(t.id));

    // Get the colours that are enabled for at least one material
    const enabledColourIds = new Set<string>();
    colourStatusMap.forEach(ids => ids.forEach(id => enabledColourIds.add(id)));
    const colours = allColours.filter(c => enabledColourIds.has(c.id));

    // Get the patterns that are enabled for at least one material
    const enabledPatternIds = new Set<string>();
    patternStatusMap.forEach(ids => ids.forEach(id => enabledPatternIds.add(id)));
    const patterns = allPatterns.filter(p => enabledPatternIds.has(p.id));

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
   * For colours, materialKey specifies which material to toggle for
   */
  async togglePlanOption(planId: string, optionId: string, materialKey?: string | null): Promise<PlanCustomizationOption> {
    const supabase = getAdminClient();

    // Build query based on whether we have a material key
    let query = supabase
      .from('plan_customization_options')
      .select('is_enabled')
      .eq('plan_id', planId)
      .eq('option_id', optionId);

    if (materialKey) {
      query = query.eq('material_key', materialKey);
    } else {
      query = query.is('material_key', null);
    }

    const { data: current, error: fetchError } = await query.single();

    if (fetchError) {
      // If not found, create it with is_enabled = true
      if (fetchError.code === 'PGRST116') {
        const { data: newRecord, error: insertError } = await supabase
          .from('plan_customization_options')
          .insert({
            plan_id: planId,
            option_id: optionId,
            material_key: materialKey || null,
            is_enabled: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating plan option:', insertError);
          throw new Error(`Failed to create plan option: ${insertError.message}`);
        }
        return newRecord as PlanCustomizationOption;
      }

      console.error('Error fetching plan option:', fetchError);
      throw new Error(`Failed to fetch plan option: ${fetchError.message}`);
    }

    // Toggle the state
    let updateQuery = supabase
      .from('plan_customization_options')
      .update({
        is_enabled: !current.is_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('plan_id', planId)
      .eq('option_id', optionId);

    if (materialKey) {
      updateQuery = updateQuery.eq('material_key', materialKey);
    } else {
      updateQuery = updateQuery.is('material_key', null);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      console.error('Error updating plan option:', error);
      throw new Error(`Failed to update plan option: ${error.message}`);
    }

    return data as PlanCustomizationOption;
  },

  /**
   * Batch set plan option states (for Save All functionality)
   * Sets multiple plan options to specific enabled/disabled states in one go
   */
  async batchSetPlanOptions(planId: string, toggles: Array<{ option_id: string; material_key: string | null; is_enabled: boolean }>): Promise<number> {
    const supabase = getAdminClient();
    let updated = 0;

    for (const toggle of toggles) {
      // Try to find existing record
      let query = supabase
        .from('plan_customization_options')
        .select('id, is_enabled')
        .eq('plan_id', planId)
        .eq('option_id', toggle.option_id);

      if (toggle.material_key) {
        query = query.eq('material_key', toggle.material_key);
      } else {
        query = query.is('material_key', null);
      }

      const { data: existing, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Error checking plan option:', fetchError);
        continue;
      }

      if (existing) {
        // Update existing record
        let updateQuery = supabase
          .from('plan_customization_options')
          .update({
            is_enabled: toggle.is_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('plan_id', planId)
          .eq('option_id', toggle.option_id);

        if (toggle.material_key) {
          updateQuery = updateQuery.eq('material_key', toggle.material_key);
        } else {
          updateQuery = updateQuery.is('material_key', null);
        }

        const { error } = await updateQuery;
        if (!error) updated++;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('plan_customization_options')
          .insert({
            plan_id: planId,
            option_id: toggle.option_id,
            material_key: toggle.material_key,
            is_enabled: toggle.is_enabled
          });
        if (!error) updated++;
      }
    }

    return updated;
  },

  /**
   * Get all options with plan-specific enabled status for admin view
   * For colours, returns material-specific status based on selectedMaterial
   */
  async getAllOptionsWithPlanStatus(planId: string, selectedMaterial?: string): Promise<(CardCustomizationOption & { plan_enabled: boolean })[]> {
    const supabase = getAdminClient();

    // Get all options
    const allOptions = await this.getAll();

    // Get plan-specific settings
    const { data: planOptions, error } = await supabase
      .from('plan_customization_options')
      .select('option_id, material_key, is_enabled')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching plan options:', error);
      throw new Error(`Failed to fetch plan options: ${error.message}`);
    }

    // Create maps for option_id -> is_enabled
    // For non-colours: option_id -> is_enabled (material_key is null)
    // For colours: option_id + material_key -> is_enabled
    const planOptionMap = new Map<string, boolean>();
    const colourMaterialMap = new Map<string, boolean>(); // key: `${option_id}_${material_key}`

    planOptions?.forEach(po => {
      if (po.material_key) {
        // Colour with material-specific setting
        colourMaterialMap.set(`${po.option_id}_${po.material_key}`, po.is_enabled);
      } else {
        // Non-colour option (material, texture, pattern)
        planOptionMap.set(po.option_id, po.is_enabled);
      }
    });

    // Merge the data
    return allOptions.map(option => {
      let plan_enabled = false;

      if ((option.category === 'colour' || option.category === 'texture' || option.category === 'pattern') && selectedMaterial) {
        // For colours, textures, and patterns, check material-specific enabled status
        plan_enabled = colourMaterialMap.get(`${option.id}_${selectedMaterial}`) ?? false;
      } else {
        // For materials only, use the global plan setting
        plan_enabled = planOptionMap.get(option.id) ?? false;
      }

      return {
        ...option,
        plan_enabled
      };
    });
  }
};
