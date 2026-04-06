import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List staff users (non-'user' roles only for admin panel)
export const GET = requireAdmin(
  async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const role = searchParams.get('role');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const showAll = searchParams.get('all'); // pass ?all=true to see everyone

      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // By default only show staff (non-user roles) unless ?all=true
      if (!showAll) {
        query = query.neq('role', 'user');
      }

      if (role) query = query.eq('role', role);
      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: users, error } = await query;

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      const transformedUsers = users?.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
        email: user.email,
        phone: user.phone_number,
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.created_at,
        permissions: [],
      })) || [];

      return NextResponse.json(transformedUsers);
    } catch (error) {
      console.error('Error in users API:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
  }
);

// POST — Create a new staff user
export const POST = requireAdmin(
  async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { name, email, phone, role, status } = body;

      if (!email || !phone || !name) {
        return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone.trim())
        .single();

      if (existingPhone) {
        return NextResponse.json({ error: 'A user with this phone number already exists' }, { status: 409 });
      }

      const nameParts = name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          first_name: firstName,
          last_name: lastName,
          phone_number: phone || null,
          role: role || 'user',
          status: status || 'active',
          email_verified: true,
          mobile_verified: !!phone,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
      }

      // Also assign role in user_roles table if roles table exists
      try {
        const { data: roleRecord } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role || 'user')
          .single();

        if (roleRecord) {
          await supabase
            .from('user_roles')
            .upsert({ user_id: user.id, role_id: roleRecord.id }, { onConflict: 'user_id,role_id' });
        }
      } catch {
        // Non-fatal if roles table doesn't exist yet
      }

      // Save module access if provided
      const { modules } = body;
      if (modules && Array.isArray(modules) && modules.length > 0) {
        try {
          const moduleRows = modules.map((moduleKey: string) => ({
            user_id: user.id,
            module_key: moduleKey,
          }));
          await supabase.from('user_module_access').insert(moduleRows);
        } catch {
          // Non-fatal if table doesn't exist yet
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          phone: user.phone_number,
          role: user.role,
          status: user.status || 'active',
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
  }
);

// DELETE — Delete a user
export const DELETE = requireAdmin(
  async function DELETE(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'User id is required' }, { status: 400 });
      }

      // Don't allow deleting super admin
      const { data: user } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', id)
        .single();

      if (user?.role === 'super_admin') {
        return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
      }

      // Delete from user_roles first (cascade should handle this but be safe)
      await supabase.from('user_roles').delete().eq('user_id', id);

      // Delete from user_sessions
      await supabase.from('user_sessions').delete().eq('user_id', id);

      // Delete the user
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
  }
);
