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

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club';
  price: number;
  gst_percentage: number;
  vat_percentage: number;
  description: string;
  features: string[];
  status: 'active' | 'inactive' | 'draft';
  popular: boolean;
  allowed_countries: string[];
  display_order: number;
  founders_total_price: number | null; // Total price for Founders Club (system back-calculates base by region)
  created_at: string;
  updated_at: string;
}

export interface CreatePlanData {
  name: string;
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club';
  price: number;
  gst_percentage?: number;
  vat_percentage?: number;
  description: string;
  features: string[];
  status?: 'active' | 'inactive' | 'draft';
  popular?: boolean;
  allowed_countries?: string[];
  display_order?: number;
  founders_total_price?: number | null;
}

export interface UpdatePlanData extends Partial<CreatePlanData> {}

export const SupabasePlansStore = {
  /**
   * Get all subscription plans (ordered by display_order)
   */
  async getAll(): Promise<SubscriptionPlan[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return data as SubscriptionPlan[];
  },

  /**
   * Get active subscription plans (for public use, ordered by display_order)
   */
  async getActive(): Promise<SubscriptionPlan[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching active plans:', error);
      throw new Error(`Failed to fetch active plans: ${error.message}`);
    }

    return data as SubscriptionPlan[];
  },

  /**
   * Get plan by ID
   */
  async getById(id: string): Promise<SubscriptionPlan | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching plan:', error);
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    return data as SubscriptionPlan;
  },

  /**
   * Create a new subscription plan
   */
  async create(planData: CreatePlanData): Promise<SubscriptionPlan> {
    const supabase = getAdminClient();

    // If display_order not provided, get the next available position
    let displayOrder = planData.display_order;
    if (!displayOrder) {
      const allPlans = await this.getAll();
      displayOrder = allPlans.length > 0
        ? Math.max(...allPlans.map(p => p.display_order)) + 1
        : 1;
    }

    const newPlan = {
      name: planData.name,
      type: planData.type,
      price: planData.price,
      gst_percentage: planData.gst_percentage || 18,
      vat_percentage: planData.vat_percentage || 5,
      description: planData.description,
      features: planData.features,
      status: planData.status || 'draft',
      popular: planData.popular || false,
      allowed_countries: planData.allowed_countries || ['India', 'UAE', 'USA', 'UK'],
      display_order: displayOrder,
      founders_total_price: planData.founders_total_price || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([newPlan])
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      throw new Error(`Failed to create plan: ${error.message}`);
    }

    return data as SubscriptionPlan;
  },

  /**
   * Update an existing subscription plan
   */
  async update(id: string, planData: UpdatePlanData): Promise<SubscriptionPlan> {
    const supabase = getAdminClient();

    // Special handling for display_order to avoid unique constraint violations
    if (planData.display_order !== undefined) {
      // Get the current plan's display_order
      const { data: currentPlan } = await supabase
        .from('subscription_plans')
        .select('display_order')
        .eq('id', id)
        .single();

      if (currentPlan && currentPlan.display_order !== planData.display_order) {
        // Check if another plan already has the target display_order
        const { data: conflictingPlan } = await supabase
          .from('subscription_plans')
          .select('id, display_order')
          .eq('display_order', planData.display_order)
          .neq('id', id)
          .single();

        if (conflictingPlan) {
          // Three-step swap to avoid unique constraint violations:

          // Step 1: Move conflicting plan to temporary high number
          const tempOrder = 9999;
          await supabase
            .from('subscription_plans')
            .update({ display_order: tempOrder })
            .eq('id', conflictingPlan.id);

          // Step 2: Update current plan to desired display_order
          await supabase
            .from('subscription_plans')
            .update({ display_order: planData.display_order })
            .eq('id', id);

          // Step 3: Move conflicting plan to current plan's old position
          await supabase
            .from('subscription_plans')
            .update({ display_order: currentPlan.display_order })
            .eq('id', conflictingPlan.id);

          // Remove display_order from planData to avoid duplicate update
          const { display_order, ...restData } = planData;
          planData = restData as UpdatePlanData;
        }
      }
    }

    const updateData = {
      ...planData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }

    return data as SubscriptionPlan;
  },

  /**
   * Delete a subscription plan
   */
  async delete(id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plan:', error);
      throw new Error(`Failed to delete plan: ${error.message}`);
    }
  },

  /**
   * Get plan statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    avgPrice: number;
  }> {
    const plans = await this.getAll();

    return {
      total: plans.length,
      active: plans.filter(p => p.status === 'active').length,
      inactive: plans.filter(p => p.status === 'inactive').length,
      draft: plans.filter(p => p.status === 'draft').length,
      avgPrice: plans.length > 0
        ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length
        : 0
    };
  }
};
