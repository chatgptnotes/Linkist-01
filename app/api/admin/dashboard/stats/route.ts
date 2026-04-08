import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // ── Date boundaries (computed once) ─────────────────────────────
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── Single parallel batch: ALL queries fire at once ─────────────
    const [
      totalOrdersResult,
      totalCustomersResult,
      pendingOrdersResult,
      todaysOrdersResult,
      thisWeekResult,
      lastWeekResult,
      allOrdersResult,
    ] = await Promise.all([
      // 1. Total orders count
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true }),

      // 2. Total customers count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // 3. Pending orders count
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // 4. Today's orders count
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString()),

      // 5. This week's orders count (for weekly growth)
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisWeekStart.toISOString()),

      // 6. Last week's orders count (for weekly growth)
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeekStart.toISOString())
        .lte('created_at', lastWeekEnd.toISOString()),

      // 7. All orders — status + pricing + created_at (single fetch for
      //    revenue, today's revenue, monthly growth, and status counts)
      supabase
        .from('orders')
        .select('status, pricing, created_at'),
    ]);

    // ── Derive everything from the single orders fetch ──────────────
    const allOrders = allOrdersResult.data ?? [];

    let totalRevenue = 0;
    let todaysRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    const statusCounts: Record<string, number> = {};

    const todayStartMs = todayStart.getTime();
    const todayEndMs = todayEnd.getTime();
    const thisMonthStartMs = thisMonthStart.getTime();
    const lastMonthStartMs = lastMonthStart.getTime();

    for (const order of allOrders) {
      // Status counts
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      const pricing = order.pricing as Record<string, unknown> | null;
      const orderTotal = Number((pricing as any)?.total) || 0;
      const isCancelled = order.status === 'cancelled';
      const createdMs = new Date(order.created_at).getTime();

      // Total revenue (exclude cancelled)
      if (!isCancelled) {
        totalRevenue += orderTotal;
      }

      // Today's revenue (exclude cancelled)
      if (!isCancelled && createdMs >= todayStartMs && createdMs <= todayEndMs) {
        todaysRevenue += orderTotal;
      }

      // This month revenue (exclude cancelled)
      if (!isCancelled && createdMs >= thisMonthStartMs) {
        thisMonthRevenue += orderTotal;
      }

      // Last month revenue (exclude cancelled)
      if (!isCancelled && createdMs >= lastMonthStartMs && createdMs < thisMonthStartMs) {
        lastMonthRevenue += orderTotal;
      }
    }

    // ── Growth calculations ─────────────────────────────────────────
    const thisWeekOrders = thisWeekResult.count ?? 0;
    const lastWeekOrders = lastWeekResult.count ?? 0;

    const weeklyGrowth = lastWeekOrders > 0
      ? Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100)
      : 0;

    const monthlyGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // ── Response (identical shape to before) ────────────────────────
    return NextResponse.json({
      totalOrders: totalOrdersResult.count ?? 0,
      totalRevenue: Number(totalRevenue) || 0,
      totalCustomers: totalCustomersResult.count ?? 0,
      pendingOrders: pendingOrdersResult.count ?? 0,
      todaysOrders: todaysOrdersResult.count ?? 0,
      todaysRevenue: Number(todaysRevenue) || 0,
      weeklyGrowth,
      monthlyGrowth,
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}