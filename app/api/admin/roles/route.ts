import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/roles — List all roles with their permissions
export const GET = requireAdmin(async function GET() {
  try {
    // Fetch roles
    const { data: roles, error: rolesErr } = await supabase
      .from('roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name');

    if (rolesErr) {
      return NextResponse.json({ error: rolesErr.message }, { status: 500 });
    }

    // Fetch all role_permissions with permission details
    const { data: rolePerms, error: rpErr } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id, permissions(id, module, action, description)');

    if (rpErr) {
      return NextResponse.json({ error: rpErr.message }, { status: 500 });
    }

    // Attach permissions to each role
    const rolesWithPerms = roles?.map(role => {
      const perms = rolePerms
        ?.filter(rp => rp.role_id === role.id)
        .map(rp => {
          const p = rp.permissions as any;
          return {
            id: p.id,
            module: p.module,
            action: p.action,
            key: `${p.action}:${p.module}`,
            description: p.description,
          };
        }) || [];

      return { ...role, permissions: perms };
    });

    return NextResponse.json(rolesWithPerms);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
});

// POST /api/admin/roles — Create a new role
export const POST = requireAdmin(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, display_name, description } = body;

    if (!name || !display_name) {
      return NextResponse.json({ error: 'name and display_name are required' }, { status: 400 });
    }

    // Sanitize name: lowercase, underscores
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name: sanitizedName,
        display_name,
        description: description || null,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
});

// PUT /api/admin/roles — Update a role
export const PUT = requireAdmin(async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, display_name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
    }

    // Check if role is system role — only allow description/display_name updates
    const { data: existing } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();

    const { data: role, error } = await supabase
      .from('roles')
      .update({
        display_name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
});

// DELETE /api/admin/roles — Delete a role (non-system only)
export const DELETE = requireAdmin(async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
    }

    // Check if system role
    const { data: role } = await supabase
      .from('roles')
      .select('is_system, name')
      .eq('id', id)
      .single();

    if (role?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 });
    }

    // Check if any users have this role
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id);

    if (count && count > 0) {
      return NextResponse.json({
        error: `Cannot delete role: ${count} user(s) are assigned to it. Reassign them first.`
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
});
