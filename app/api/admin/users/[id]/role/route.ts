import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/admin/users/[id]/role — Assign a role to a user
export const PUT = requireAdmin(async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { role_id, role_name } = body; // Accept either role_id or role_name

    // Resolve role
    let resolvedRoleId = role_id;
    let resolvedRoleName = role_name;

    if (!resolvedRoleId && resolvedRoleName) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', resolvedRoleName)
        .single();

      if (!role) {
        return NextResponse.json({ error: `Role '${resolvedRoleName}' not found` }, { status: 404 });
      }
      resolvedRoleId = role.id;
      resolvedRoleName = role.name;
    } else if (resolvedRoleId) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', resolvedRoleId)
        .single();

      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }
      resolvedRoleName = role.name;
    } else {
      return NextResponse.json({ error: 'role_id or role_name is required' }, { status: 400 });
    }

    // Verify user exists
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove existing roles for this user (single-role model)
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Assign new role
    const { error: assignErr } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: resolvedRoleId,
      });

    if (assignErr) {
      return NextResponse.json({ error: assignErr.message }, { status: 500 });
    }

    // Also update the users.role column for backward compatibility
    await supabase
      .from('users')
      .update({ role: resolvedRoleName, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      user_id: userId,
      role_name: resolvedRoleName,
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
});

// GET /api/admin/users/[id]/role — Get user's current role
export const GET = requireAdmin(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id, roles(id, name, display_name, description)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ role: null });
    }

    const role = data.roles as any;
    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description,
      },
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
});
