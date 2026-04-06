import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/users/[id]/modules — Fetch user's module access
export const GET = requireAdmin(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const { data, error } = await supabase
      .from('user_module_access')
      .select('module_key')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ modules: [] });
    }

    const modules = (data || []).map(row => row.module_key);
    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching user modules:', error);
    return NextResponse.json({ modules: [] });
  }
});
