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
  texture_key?: string | null;
  colour_key?: string | null;
}

// Structured options for the configure page
// colourOptions keys: "material|texture" e.g. "pvc|matte"
// patternOptions keys: "material|texture|colour" e.g. "pvc|matte|white"
export interface StructuredCustomizationOptions {
  materials: CardCustomizationOption[];
  textures: CardCustomizationOption[];
  colours: CardCustomizationOption[];
  patterns: CardCustomizationOption[];
  materialPrices: Record<string, number>;
  textureOptions: Record<string, string[]>;
  colourOptions: Record<string, string[]>;
  patternOptions: Record<string, string[]>;
  defaults?: Record<string, { texture?: string; colour?: string; pattern?: string }>;
}

// Hierarchy key helpers — shared convention for key construction
export const HIERARCHY_SEPARATOR = '|';

export function buildHierarchyKey(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(HIERARCHY_SEPARATOR);
}

// Apply nullable hierarchy filters to a Supabase query builder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyHierarchyFilters(
  query: any,
  keys: { material_key?: string | null; texture_key?: string | null; colour_key?: string | null }
) {
  if (keys.material_key) query = query.eq('material_key', keys.material_key);
  else query = query.is('material_key', null);
  if (keys.texture_key) query = query.eq('texture_key', keys.texture_key);
  else query = query.is('texture_key', null);
  if (keys.colour_key) query = query.eq('colour_key', keys.colour_key);
  else query = query.is('colour_key', null);
  return query;
}

// Options object for set/clear default
export interface DefaultOptionParams {
  planId: string;
  optionId: string;
  materialKey?: string | null;
  textureKey?: string | null;
  colourKey?: string | null;
  category?: string;
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

    // Build pattern options map (material -> patterns) - all patterns available for all materials in non-plan mode
    const patternOptions: Record<string, string[]> = {};
    materials.forEach(m => {
      patternOptions[m.option_key] = patterns.map(p => p.option_key);
    });

    return {
      materials,
      textures,
      colours,
      patterns,
      materialPrices,
      textureOptions,
      colourOptions,
      patternOptions
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
   * Returns hierarchy-aware maps:
   *   textureOptions: { "pvc": ["matte","glossy"], ... }           (material → textures)
   *   colourOptions:  { "pvc|matte": ["white","black"], ... }      (material|texture → colours)
   *   patternOptions: { "pvc|matte|white": ["geometric"], ... }    (material|texture|colour → patterns)
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
      return this.getStructuredOptions(true);
    }

    // Get enabled materials (material_key is NULL for materials)
    const { data: globalOptions, error: optError } = await supabase
      .from('plan_customization_options')
      .select(`option:card_customization_options(*)`)
      .eq('plan_id', plan.id)
      .eq('is_enabled', true)
      .is('material_key', null);

    if (optError) {
      console.error('Error fetching global options:', optError);
      return this.getStructuredOptions(true);
    }

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

    // Get all base options by category + hierarchy rows in parallel
    const [allTexturesData, allColoursData, allPatternsData, hierarchyResult] = await Promise.all([
      supabase.from('card_customization_options').select('*').eq('category', 'texture').eq('is_enabled', true),
      supabase.from('card_customization_options').select('*').eq('category', 'colour').eq('is_enabled', true),
      supabase.from('card_customization_options').select('*').eq('category', 'pattern').eq('is_enabled', true),
      supabase.from('plan_customization_options')
        .select('option_id, material_key, texture_key, colour_key, is_enabled, is_default')
        .eq('plan_id', plan.id).eq('is_enabled', true).not('material_key', 'is', null),
    ]);

    const allTextures = (allTexturesData.data || []) as CardCustomizationOption[];
    const allColours = (allColoursData.data || []) as CardCustomizationOption[];
    const allPatterns = (allPatternsData.data || []) as CardCustomizationOption[];
    const hierarchyRows = hierarchyResult.data;

    if (hierarchyResult.error) {
      console.error('Error fetching hierarchy rows:', hierarchyResult.error);
    }

    // ID → option_key lookups
    const textureIdToKey = new Map(allTextures.map(t => [t.id, t.option_key]));
    const colourIdToKey = new Map(allColours.map(c => [c.id, c.option_key]));
    const patternIdToKey = new Map(allPatterns.map(p => [p.id, p.option_key]));

    const colourIds = new Set(allColours.map(c => c.id));
    const textureIds = new Set(allTextures.map(t => t.id));
    const patternIds = new Set(allPatterns.map(p => p.id));

    // Build hierarchy maps
    // textureOptions: material → texture option_keys
    const textureOptionsMap = new Map<string, Set<string>>();
    // colourOptions: "material|texture" → colour option_keys
    const colourOptionsMap = new Map<string, Set<string>>();
    // patternOptions: "material|texture|colour" → pattern option_keys
    const patternOptionsMap = new Map<string, Set<string>>();

    // Default maps
    const defaultTextureMap = new Map<string, string>(); // material → texture option_key
    const defaultColourMap = new Map<string, string>();   // "material|texture" → colour option_key
    const defaultPatternMap = new Map<string, string>();  // "material|texture|colour" → pattern option_key

    // Collect all unique IDs for filtering the returned arrays
    const enabledTextureIds = new Set<string>();
    const enabledColourIds = new Set<string>();
    const enabledPatternIds = new Set<string>();

    (hierarchyRows || []).forEach(row => {
      if (!row.material_key) return;

      if (textureIds.has(row.option_id) && !row.texture_key) {
        // Texture row: material_key set, texture_key NULL
        const textureKey = textureIdToKey.get(row.option_id);
        if (!textureKey) return;
        if (!textureOptionsMap.has(row.material_key)) textureOptionsMap.set(row.material_key, new Set());
        textureOptionsMap.get(row.material_key)!.add(textureKey);
        enabledTextureIds.add(row.option_id);
        if (row.is_default) defaultTextureMap.set(row.material_key, textureKey);
      } else if (colourIds.has(row.option_id) && row.texture_key && !row.colour_key) {
        // Colour row: material_key + texture_key set, colour_key NULL
        const colourKey = colourIdToKey.get(row.option_id);
        if (!colourKey) return;
        const mapKey = buildHierarchyKey(row.material_key, row.texture_key);
        if (!colourOptionsMap.has(mapKey)) colourOptionsMap.set(mapKey, new Set());
        colourOptionsMap.get(mapKey)!.add(colourKey);
        enabledColourIds.add(row.option_id);
        if (row.is_default) defaultColourMap.set(mapKey, colourKey);
      } else if (patternIds.has(row.option_id) && row.texture_key && row.colour_key) {
        // Pattern row: all keys set
        const patternKey = patternIdToKey.get(row.option_id);
        if (!patternKey) return;
        const mapKey = buildHierarchyKey(row.material_key, row.texture_key, row.colour_key);
        if (!patternOptionsMap.has(mapKey)) patternOptionsMap.set(mapKey, new Set());
        patternOptionsMap.get(mapKey)!.add(patternKey);
        enabledPatternIds.add(row.option_id);
        if (row.is_default) defaultPatternMap.set(mapKey, patternKey);
      }
    });

    // Build material prices
    const materialPrices: Record<string, number> = {};
    materials.forEach(m => { if (m.price !== null) materialPrices[m.option_key] = m.price; });

    // Convert maps to plain objects
    const textureOptions: Record<string, string[]> = {};
    textureOptionsMap.forEach((keys, mat) => { textureOptions[mat] = Array.from(keys); });

    const colourOptions: Record<string, string[]> = {};
    colourOptionsMap.forEach((keys, mapKey) => { colourOptions[mapKey] = Array.from(keys); });

    const patternOptions: Record<string, string[]> = {};
    patternOptionsMap.forEach((keys, mapKey) => { patternOptions[mapKey] = Array.from(keys); });

    // Filter to only options that are enabled in at least one hierarchy path
    const textures = allTextures.filter(t => enabledTextureIds.has(t.id));
    const colours = allColours.filter(c => enabledColourIds.has(c.id));
    const patterns = allPatterns.filter(p => enabledPatternIds.has(p.id));

    // Build defaults map
    const defaults: Record<string, { texture?: string; colour?: string; pattern?: string }> = {};
    materials.forEach(m => {
      const mat = m.option_key;
      const defTexture = defaultTextureMap.get(mat);
      // For colour/pattern defaults, we need the texture context — store the first found default
      let defColour: string | undefined;
      let defPattern: string | undefined;
      defaultColourMap.forEach((colourKey, mapKey) => {
        if (mapKey.startsWith(mat + HIERARCHY_SEPARATOR) && !defColour) defColour = colourKey;
      });
      defaultPatternMap.forEach((patternKey, mapKey) => {
        if (mapKey.startsWith(mat + HIERARCHY_SEPARATOR) && !defPattern) defPattern = patternKey;
      });
      if (defTexture || defColour || defPattern) {
        defaults[mat] = { texture: defTexture, colour: defColour, pattern: defPattern };
      }
    });

    return {
      materials,
      textures,
      colours,
      patterns,
      materialPrices,
      textureOptions,
      colourOptions,
      patternOptions,
      defaults
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
  async batchSetPlanOptions(planId: string, toggles: Array<{ option_id: string; material_key: string | null; texture_key?: string | null; colour_key?: string | null; is_enabled: boolean }>): Promise<number> {
    const supabase = getAdminClient();

    const results = await Promise.all(toggles.map(async (toggle) => {
      const baseQuery = supabase
        .from('plan_customization_options')
        .select('id, is_enabled')
        .eq('plan_id', planId)
        .eq('option_id', toggle.option_id);

      const query = applyHierarchyFilters(baseQuery, toggle);
      const { data: existingRows, error: fetchError } = await query.limit(1);

      if (fetchError) {
        console.error('Error checking plan option:', fetchError);
        return false;
      }

      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        // Update ALL matching rows to handle potential duplicates
        const updateQuery = applyHierarchyFilters(
          supabase
            .from('plan_customization_options')
            .update({ is_enabled: toggle.is_enabled, updated_at: new Date().toISOString() })
            .eq('plan_id', planId)
            .eq('option_id', toggle.option_id),
          toggle
        );
        const { error } = await updateQuery;
        return !error;
      } else {
        const { error } = await supabase
          .from('plan_customization_options')
          .insert({
            plan_id: planId,
            option_id: toggle.option_id,
            material_key: toggle.material_key || null,
            texture_key: toggle.texture_key || null,
            colour_key: toggle.colour_key || null,
            is_enabled: toggle.is_enabled
          });
        return !error;
      }
    }));

    return results.filter(Boolean).length;
  },

  /**
   * Get all options with plan-specific enabled status for admin view
   * For colours, returns material-specific status based on selectedMaterial
   */
  async getAllOptionsWithPlanStatus(
    planId: string,
    selectedMaterial?: string,
    selectedTexture?: string,
    selectedColour?: string
  ): Promise<(CardCustomizationOption & { plan_enabled: boolean; is_default?: boolean })[]> {
    const supabase = getAdminClient();

    // Get all options
    const allOptions = await this.getAll();

    // Get plan-specific settings (including is_default)
    const { data: planOptions, error } = await supabase
      .from('plan_customization_options')
      .select('option_id, material_key, texture_key, colour_key, is_enabled, is_default')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching plan options:', error);
      throw new Error(`Failed to fetch plan options: ${error.message}`);
    }

    // Build lookup maps
    // Materials: option_id -> { is_enabled, is_default } (material_key is null)
    // Textures: `${option_id}_${material_key}` -> { is_enabled, is_default } (texture_key is null)
    // Colours: `${option_id}_${material_key}_${texture_key}` -> { is_enabled, is_default }
    // Patterns: `${option_id}_${material_key}_${texture_key}_${colour_key}` -> { is_enabled, is_default }
    const statusMap = new Map<string, { is_enabled: boolean; is_default: boolean }>();

    planOptions?.forEach(po => {
      let key: string;
      if (!po.material_key) {
        // Material-level (materials themselves)
        key = po.option_id;
      } else if (!po.texture_key) {
        // Texture-level: material_key set, no texture_key
        key = `${po.option_id}_${po.material_key}`;
      } else if (!po.colour_key) {
        // Colour-level: material_key + texture_key set
        key = `${po.option_id}_${po.material_key}_${po.texture_key}`;
      } else {
        // Pattern-level: all keys set
        key = `${po.option_id}_${po.material_key}_${po.texture_key}_${po.colour_key}`;
      }
      statusMap.set(key, { is_enabled: po.is_enabled, is_default: po.is_default ?? false });
    });

    // Merge the data
    return allOptions.map(option => {
      let key: string;

      if (option.category === 'material') {
        key = option.id;
      } else if (option.category === 'texture' && selectedMaterial) {
        key = `${option.id}_${selectedMaterial}`;
      } else if (option.category === 'colour' && selectedMaterial && selectedTexture) {
        key = `${option.id}_${selectedMaterial}_${selectedTexture}`;
      } else if (option.category === 'pattern' && selectedMaterial && selectedTexture && selectedColour) {
        key = `${option.id}_${selectedMaterial}_${selectedTexture}_${selectedColour}`;
      } else {
        key = option.id;
      }

      const status = statusMap.get(key);
      return {
        ...option,
        plan_enabled: status?.is_enabled ?? false,
        is_default: status?.is_default ?? false
      };
    });
  },

  /**
   * Set an option as the default for a plan + material combination.
   * Clears any existing default for the same (plan, category, material_key) first.
   */
  async setDefaultOption(params: DefaultOptionParams): Promise<boolean> {
    const { planId, optionId, materialKey, textureKey, colourKey, category } = params;
    const supabase = getAdminClient();
    const keys = { material_key: materialKey || null, texture_key: textureKey || null, colour_key: colourKey || null };

    if (!category) return false;

    // Get all option IDs in this category to clear existing defaults
    const { data: categoryOptions } = await supabase
      .from('card_customization_options')
      .select('id')
      .eq('category', category);

    const categoryOptionIds = (categoryOptions || []).map(o => o.id);
    if (categoryOptionIds.length === 0) return false;

    // Clear existing defaults for this plan + category + hierarchy keys
    const clearQuery = applyHierarchyFilters(
      supabase
        .from('plan_customization_options')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('plan_id', planId)
        .eq('is_default', true)
        .in('option_id', categoryOptionIds),
      keys
    );
    await clearQuery;

    // Find or create the record and set as default
    // Use .limit(1) instead of .maybeSingle() to handle potential duplicate rows
    // (PostgreSQL UNIQUE constraints treat NULLs as distinct, so duplicates can exist)
    const findQuery = applyHierarchyFilters(
      supabase
        .from('plan_customization_options')
        .select('id')
        .eq('plan_id', planId)
        .eq('option_id', optionId),
      keys
    );
    const { data: existingRows, error: findError } = await findQuery.limit(1);

    if (findError) { console.error('Error finding option for default:', findError); return false; }

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    if (existing) {
      // Update ALL matching rows (not just one) to handle duplicates
      const updateQuery = applyHierarchyFilters(
        supabase
          .from('plan_customization_options')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('plan_id', planId)
          .eq('option_id', optionId),
        keys
      );
      const { error } = await updateQuery;
      if (error) { console.error('Error setting default option:', error); return false; }
    } else {
      const { error } = await supabase
        .from('plan_customization_options')
        .insert({
          plan_id: planId, option_id: optionId,
          material_key: materialKey || null, texture_key: textureKey || null, colour_key: colourKey || null,
          is_enabled: true, is_default: true
        });
      if (error) { console.error('Error inserting default option:', error); return false; }
    }

    return true;
  },

  async clearDefaultOption(params: Omit<DefaultOptionParams, 'category'>): Promise<boolean> {
    const { planId, optionId, materialKey, textureKey, colourKey } = params;
    const supabase = getAdminClient();

    const query = applyHierarchyFilters(
      supabase
        .from('plan_customization_options')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('plan_id', planId)
        .eq('option_id', optionId),
      { material_key: materialKey || null, texture_key: textureKey || null, colour_key: colourKey || null }
    );

    const { error } = await query;
    if (error) { console.error('Error clearing default option:', error); return false; }
    return true;
  }
};
