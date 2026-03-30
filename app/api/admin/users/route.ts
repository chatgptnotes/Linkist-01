import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Any admin can view users
export const GET = requireAdmin(
  async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const role = searchParams.get('role');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const type = searchParams.get('type'); // 'admin' to fetch admin_users

      // If type=admin, fetch from admin_users table
      if (type === 'admin') {
        let query = supabase
          .from('admin_users')
          .select('id, email, username, first_name, last_name, role, is_super_admin, is_active, last_login_at, created_at')
          .order('created_at', { ascending: false });

        if (role) query = query.eq('role', role);
        if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);

        const { data: adminUsers, error } = await query;

        if (error) {
          console.error('Error fetching admin users:', error);
          return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
        }

        const transformed = adminUsers?.map(u => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'No Name',
          email: u.email,
          role: u.role,
          is_super_admin: u.is_super_admin,
          status: u.is_active ? 'active' : 'inactive',
          lastLogin: u.last_login_at,
          createdAt: u.created_at,
        })) || [];

        return NextResponse.json(transformed);
      }

      // Default: fetch regular users from profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (role) query = query.eq('role', role);
      if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

      const { data: users, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      const transformedUsers = users?.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
        email: user.email,
        phone: user.phone_number,
        role: user.role || 'user',
        status: 'active',
        lastLogin: null,
        createdAt: user.created_at,
        permissions: []
      })) || [];

      return NextResponse.json(transformedUsers);
    } catch (error) {
      console.error('Error in users API:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
  }
);

// POST: Only super admin can create admin users
export const POST = requireSuperAdmin(
  async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { name, email, password, role, is_super_admin } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      if (!role || !['super_admin', 'admin', 'manager', 'support', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'An admin user with this email already exists' }, { status: 409 });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      const nameParts = name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: newUser, error } = await supabase
        .from('admin_users')
        .insert({
          email: email.toLowerCase(),
          username: email.split('@')[0],
          password_hash,
          first_name: firstName,
          last_name: lastName,
          role: role,
          is_super_admin: is_super_admin || role === 'super_admin',
          is_active: true,
        })
        .select('id, email, first_name, last_name, role, is_super_admin, is_active, created_at')
        .single();

      if (error) {
        console.error('Error creating admin user:', error);
        return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          name: `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim(),
          email: newUser.email,
          role: newUser.role,
          is_super_admin: newUser.is_super_admin,
          status: newUser.is_active ? 'active' : 'inactive',
          createdAt: newUser.created_at,
        }
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
    }
  }
);

// PUT: Only super admin can edit admin users
export const PUT = requireSuperAdmin(
  async function PUT(request: NextRequest) {
    try {
      const body = await request.json();
      const { id, name, role, is_active, password } = body;

      if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      const nameParts = name?.split(' ') || [];
      const updateData: any = {
        first_name: nameParts[0] || undefined,
        last_name: nameParts.slice(1).join(' ') || undefined,
        role: role,
        is_super_admin: role === 'super_admin',
        is_active: is_active,
        updated_at: new Date().toISOString(),
      };

      // If password is being changed
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
      }

      const { data: updatedUser, error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', id)
        .select('id, email, first_name, last_name, role, is_super_admin, is_active, created_at')
        .single();

      if (error) {
        console.error('Error updating admin user:', error);
        return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
          email: updatedUser.email,
          role: updatedUser.role,
          is_super_admin: updatedUser.is_super_admin,
          status: updatedUser.is_active ? 'active' : 'inactive',
          createdAt: updatedUser.created_at,
        }
      });
    } catch (error) {
      console.error('Error updating admin user:', error);
      return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
    }
  }
);

// DELETE: Only super admin can delete admin users
export const DELETE = requireSuperAdmin(
  async function DELETE(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting admin user:', error);
        return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting admin user:', error);
      return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 });
    }
  }
);
