import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseOrderStore } from '@/lib/supabase-order-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
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

export const GET = requireAdmin(
  async function GET(request: NextRequest) {
    try {
      const supabase = createAdminClient();

      // ── Parallel: fetch orders and ALL payments at the same time ───
      const [orders, { data: allPayments }] = await Promise.all([
        SupabaseOrderStore.getAll(),
        supabase
          .from('payments')
          .select('order_id, payment_method, status, amount'),
      ]);

      // Map payments by order_id for quick lookup
      const paymentsByOrderId = new Map(
        allPayments?.map(p => [p.order_id, p]) || []
      );

      // Attach payments to orders
      const ordersWithPayments = orders.map(order => ({
        ...order,
        payment: paymentsByOrderId.get(order.id) || null,
      }));

      return NextResponse.json({
        success: true,
        orders: ordersWithPayments,
        count: ordersWithPayments.length
      });
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  }
);

export const POST = requireAdmin(
  async function POST(request: NextRequest) {
    try {
      const body = await request.json();

      // If userId not provided, create/update user from order data
      let userId = body.userId;
      if (!userId && body.email) {
        console.log('👤 Admin orders API: Creating/updating user...');
        const user = await SupabaseUserStore.upsertByEmail({
          email: body.email,
          first_name: body.cardConfig?.firstName || body.customerName?.split(' ')[0] || null,
          last_name: body.cardConfig?.lastName || body.customerName?.split(' ').slice(1).join(' ') || null,
          phone_number: body.phoneNumber || null,
          email_verified: true,
          mobile_verified: !!body.phoneNumber,
        });
        userId = user.id;
        console.log('✅ Admin orders API: User created/updated:', userId);
      }

      // Create a new order with userId
      const order = await SupabaseOrderStore.create({
        ...body,
        userId
      });
      
      return NextResponse.json({
        success: true,
        order: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
  }
);