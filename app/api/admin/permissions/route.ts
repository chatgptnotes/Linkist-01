import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/permissions — List all permissions grouped by module
export const GET = requireAdmin(async function GET() {
  try {
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module')
      .order('action');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by module
    const grouped: Record<string, Array<{ id: string; action: string; description: string; key: string }>> = {};
    permissions?.forEach(p => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push({
        id: p.id,
        action: p.action,
        description: p.description,
        key: `${p.action}:${p.module}`,
      });
    });

    return NextResponse.json({
      permissions: permissions?.map(p => ({
        ...p,
        key: `${p.action}:${p.module}`,
      })),
      grouped,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
});
