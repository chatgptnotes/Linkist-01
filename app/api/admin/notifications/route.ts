import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
} from '@/lib/admin-notifications';

// GET /api/admin/notifications?include_read=true&limit=30
export async function GET(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const includeRead = url.searchParams.get('include_read') === 'true';
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50);

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(limit, includeRead),
      getUnreadCount(),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/admin/notifications  — mark as read
// Body: { ids: string[] } or { markAll: true }
export async function PATCH(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.markAll) {
      await markAllAsRead();
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await markAsRead(body.ids);
    } else {
      return NextResponse.json({ error: 'Provide ids array or markAll: true' }, { status: 400 });
    }

    const unreadCount = await getUnreadCount();
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// DELETE /api/admin/notifications — cleanup old notifications
export async function DELETE(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    await deleteOldNotifications(90);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return NextResponse.json({ error: 'Failed to delete old notifications' }, { status: 500 });
  }
}
