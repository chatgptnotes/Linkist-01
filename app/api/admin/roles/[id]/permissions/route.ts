import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/admin/roles/[id]/permissions — Replace all permissions for a role
export const PUT = requireAdmin(async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const body = await request.json();
    const { permissions } = body; // Array of "action:module" strings, e.g. ["create:patients", "read:patients"]

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'permissions must be an array of strings' }, { status: 400 });
    }

    // Verify role exists
    const { data: role, error: roleErr } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (roleErr || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Resolve permission strings to IDs
    // permissions format: ["create:patients", "read:billing", ...]
    const permParts = permissions.map((p: string) => {
      const [action, module] = p.split(':');
      return { action, module };
    });

    // Fetch all matching permission IDs
    const { data: allPerms, error: permErr } = await supabase
      .from('permissions')
      .select('id, module, action');

    if (permErr) {
      return NextResponse.json({ error: permErr.message }, { status: 500 });
    }

    const permissionIds = permParts
      .map(({ action, module }: { action: string; module: string }) =>
        allPerms?.find(p => p.action === action && p.module === module)?.id
      )
      .filter(Boolean) as string[];

    // Delete existing role_permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Insert new ones
    if (permissionIds.length > 0) {
      const inserts = permissionIds.map(pid => ({
        role_id: roleId,
        permission_id: pid,
      }));

      const { error: insertErr } = await supabase
        .from('role_permissions')
        .insert(inserts);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      role_id: roleId,
      permissions_count: permissionIds.length,
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
});

// GET /api/admin/roles/[id]/permissions — Get permissions for a role
export const GET = requireAdmin(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;

    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(id, module, action, description)')
      .eq('role_id', roleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const permissions = data?.map(rp => {
      const p = rp.permissions as any;
      return {
        id: p.id,
        module: p.module,
        action: p.action,
        key: `${p.action}:${p.module}`,
        description: p.description,
      };
    }) || [];

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
});
