import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export type NotificationType =
  | 'new_order'
  | 'order_status'
  | 'new_customer'
  | 'founder_request'
  | 'payment'
  | 'low_stock'
  | 'system';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at?: string;
}

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('admin_notifications').insert({
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error('Failed to create admin notification:', error);
    }
  } catch (err) {
    // Non-blocking — never let notification failures break business logic
    console.error('Admin notification error:', err);
  }
}

export async function getNotifications(limit = 20, includeRead = false) {
  const supabase = getSupabase();
  let query = supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!includeRead) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AdminNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markAsRead(ids: string[]) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw error;
}

export async function markAllAsRead() {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteOldNotifications(daysOld = 90) {
  const supabase = getSupabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const { error } = await supabase
    .from('admin_notifications')
    .delete()
    .lt('created_at', cutoff.toISOString());

  if (error) throw error;
}

// ── Convenience helpers for common events ──

export function notifyNewOrder(orderNumber: string, customerName: string, total: number, currency = '$') {
  return createNotification({
    type: 'new_order',
    title: 'New Order Received',
    message: `${customerName} placed order ${orderNumber} for ${currency}${total.toFixed(2)}`,
    link: '/admin/orders',
    metadata: { orderNumber, customerName, total },
  });
}

export function notifyOrderStatusChange(orderNumber: string, oldStatus: string, newStatus: string) {
  return createNotification({
    type: 'order_status',
    title: 'Order Status Updated',
    message: `Order ${orderNumber} moved from ${oldStatus} to ${newStatus}`,
    link: '/admin/orders',
    metadata: { orderNumber, oldStatus, newStatus },
  });
}

export function notifyNewCustomer(name: string, email: string) {
  return createNotification({
    type: 'new_customer',
    title: 'New Customer Registered',
    message: `${name} (${email}) just signed up`,
    link: '/admin/customers',
    metadata: { name, email },
  });
}

export function notifyFounderRequest(name: string, email: string) {
  return createNotification({
    type: 'founder_request',
    title: 'New Founders Circle Request',
    message: `${name} (${email}) requested to join Founders Circle`,
    link: '/admin/founders',
    metadata: { name, email },
  });
}

export function notifyPaymentReceived(orderNumber: string, amount: number, currency = '$') {
  return createNotification({
    type: 'payment',
    title: 'Payment Received',
    message: `Payment of ${currency}${amount.toFixed(2)} received for order ${orderNumber}`,
    link: '/admin/orders',
    metadata: { orderNumber, amount },
  });
}
