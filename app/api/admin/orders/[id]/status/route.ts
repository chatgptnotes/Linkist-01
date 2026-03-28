import { NextRequest, NextResponse } from 'next/server';
import { SupabaseOrderStore, type OrderStatus } from '@/lib/supabase-order-store';
import { requireAdmin } from '@/lib/auth-middleware';
import { notifyOrderStatusChange } from '@/lib/admin-notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id: orderId } = await params;

    // Check admin access
    const session = await import('@/lib/auth-middleware').then(m => m.getCurrentUser(request));
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !['pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Fetch current order to get old status and order number
    const existingOrder = await SupabaseOrderStore.getById(orderId);
    const oldStatus = existingOrder?.status || 'unknown';

    const updatedOrder = await SupabaseOrderStore.updateStatus(orderId, status as OrderStatus);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fire admin notification (non-blocking)
    notifyOrderStatusChange(
      updatedOrder.orderNumber || orderId,
      oldStatus,
      status
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}