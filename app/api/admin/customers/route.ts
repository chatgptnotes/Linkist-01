import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseOrderStore } from '@/lib/supabase-order-store';
import { requireAdmin } from '@/lib/auth-middleware';

// Create admin client with service role key
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper function to derive plan name from order number
const getPlanFromOrderNumber = (orderNumber: string): string => {
  if (orderNumber.startsWith('LKFM-FC-')) return "Founder's Circle";
  if (orderNumber.startsWith('LKFM-SIG-')) return 'Signature';
  if (orderNumber.startsWith('LKFM-PRO-')) return 'Pro';
  if (orderNumber.startsWith('LKFM-NXT-')) return 'Next';
  if (orderNumber.startsWith('LKFM-DO-')) return 'Starter';
  if (orderNumber.startsWith('LKFM-DPLA-')) return 'Next';
  if (orderNumber.startsWith('LKFM-CDPLA-')) return 'Pro';
  return 'Starter';
};

// Helper function to determine referral status
const getReferralStatus = (usedAt: string | null, expiresAt: string): 'used' | 'pending' | 'expired' => {
  if (usedAt) return 'used';
  if (new Date(expiresAt) < new Date()) return 'expired';
  return 'pending';
};

export const GET = requireAdmin(
  async function GET(request: NextRequest) {
    try {
      const supabase = createAdminClient();

      // 1. Fetch all orders
      console.log('📊 Admin customers API: Fetching orders...');
      const orders = await SupabaseOrderStore.getAll();

      // Fetch ALL payment data in one batch query (optimized - no N+1)
      console.log('💳 Admin customers API: Fetching payments (batch)...');
      const orderIds = orders.map(o => o.id);
      const { data: allPayments } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds);

      // Map payments by order_id for quick lookup
      const paymentsByOrderId = new Map(
        allPayments?.map(p => [p.order_id, p]) || []
      );

      // Attach payments to orders
      const ordersWithPayments = orders.map(order => ({
        ...order,
        payment: paymentsByOrderId.get(order.id) || null,
      }));

      // 2. Get unique customer emails
      const customerEmails = [...new Set(ordersWithPayments.map(o => o.email).filter(Boolean))];

      // 3. Fetch user data for all customer emails
      console.log('👥 Admin customers API: Fetching user data...');
      const { data: users } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, is_founding_member')
        .in('email', customerEmails);

      const usersByEmail = new Map(users?.map(u => [u.email, u]) || []);

      // 4. Fetch all referral codes
      console.log('🔗 Admin customers API: Fetching referral data...');
      const { data: referralCodes } = await supabase
        .from('founders_invite_codes')
        .select('*')
        .eq('referral_type', 'referral');

      // 5. Build referral lookup maps
      // Map: customer email -> referrer_user_id (who referred them)
      const referredByMap = new Map<string, string>();
      // Map: user_id -> list of people they referred
      const referralsMap = new Map<string, Array<{
        email: string;
        name: string;
        code: string;
        status: 'used' | 'pending' | 'expired';
        createdAt: string;
        usedAt: string | null;
      }>>();

      for (const code of referralCodes || []) {
        // If code was used, track who was referred
        if (code.used_at && code.email) {
          referredByMap.set(code.email, code.referrer_user_id);
        }

        // Track all referrals by referrer
        if (code.referrer_user_id) {
          const existing = referralsMap.get(code.referrer_user_id) || [];
          existing.push({
            email: code.email || '',
            name: `${code.referred_first_name || ''} ${code.referred_last_name || ''}`.trim() || code.email || 'Unknown',
            code: code.code,
            status: getReferralStatus(code.used_at, code.expires_at),
            createdAt: code.created_at,
            usedAt: code.used_at
          });
          referralsMap.set(code.referrer_user_id, existing);
        }
      }

      // 6. Get referrer details for lookup
      const referrerIds = [...new Set(referralCodes?.map(c => c.referrer_user_id).filter(Boolean) || [])];
      const { data: referrers } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', referrerIds);

      const referrersById = new Map(referrers?.map(r => [r.id, r]) || []);

      // 7. Build customer list with referral data
      console.log('🏗️ Admin customers API: Building customer list...');
      const customerMap = new Map<string, typeof ordersWithPayments>();
      ordersWithPayments.forEach(order => {
        if (!order.email) return;
        const existing = customerMap.get(order.email) || [];
        customerMap.set(order.email, [...existing, order]);
      });

      const customers = Array.from(customerMap.entries()).map(([email, customerOrders]) => {
        const sortedOrders = customerOrders.sort((a, b) => a.createdAt - b.createdAt);
        const firstOrder = sortedOrders[0];
        const lastOrder = sortedOrders[sortedOrders.length - 1];
        const user = usersByEmail.get(email);

        // Calculate total spent (only confirmed orders)
        const totalSpent = customerOrders
          .filter(order => order.status !== 'pending' && order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.pricing.total, 0);

        // Get referrer info
        let referredBy: { userId: string; email: string; name: string } | null = null;
        const referrerId = referredByMap.get(email);
        if (referrerId) {
          const referrer = referrersById.get(referrerId);
          if (referrer) {
            referredBy = {
              userId: referrer.id,
              email: referrer.email,
              name: `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() || referrer.email
            };
          }
        }

        // Get referrals made by this customer
        const referrals = user ? (referralsMap.get(user.id) || []) : [];

        return {
          email,
          customerName: firstOrder.customerName,
          phoneNumber: firstOrder.phoneNumber,
          firstOrderDate: new Date(firstOrder.createdAt).toLocaleDateString(),
          totalOrders: customerOrders.length,
          totalSpent,
          lastOrderDate: new Date(lastOrder.createdAt).toLocaleDateString(),
          lastPlan: getPlanFromOrderNumber(lastOrder.orderNumber),
          orders: sortedOrders.reverse(), // Most recent first
          userId: user?.id || null,
          isFoundingMember: user?.is_founding_member || false,
          referredBy,
          referrals,
          referralCount: referrals.length
        };
      });

      console.log(`✅ Admin customers API: Returning ${customers.length} customers`);

      return NextResponse.json({
        success: true,
        customers,
        count: customers.length
      });

    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }
  }
);
