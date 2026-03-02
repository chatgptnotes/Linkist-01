import { NextRequest, NextResponse } from 'next/server'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'
import { createClient } from '@supabase/supabase-js'

import { getCurrentUser } from '@/lib/auth-middleware'

// Create admin client for payment queries
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authSession = await getCurrentUser(request)
    const user = authSession?.user
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user email from query params, but verify it matches the authenticated user
    const { searchParams } = new URL(request.url)
    const requestedEmail = searchParams.get('email')
    const email = requestedEmail || user.email

    // Only allow users to access their own data (unless admin)
    if (email !== user.email && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    console.log(`📋 Getting account data for: ${email}`)

    // Get user's orders from database
    const orders = await SupabaseOrderStore.getByEmail(email)

    // Get user profile from Supabase (if exists)
    const supabase = createAdminClient()

    // Fetch payment data for all orders in one batch query
    const orderIds = orders.map(o => o.id)
    let paymentsByOrderId = new Map<string, any>()
    if (orderIds.length > 0) {
      const { data: allPayments } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds)
      paymentsByOrderId = new Map(
        allPayments?.map(p => [p.order_id, {
          paymentMethod: p.payment_method,
          status: p.status,
          amount: p.amount,
        }]) || []
      )
    }

    // Attach payment info to orders
    const ordersWithPayments = orders.map(order => ({
      ...order,
      payment: paymentsByOrderId.get(order.id) || null,
    }))

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    // Fetch founding member status from users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('is_founding_member, founding_member_since, founding_member_plan')
      .eq('email', email)
      .single()

    // Calculate user stats
    const stats = {
      totalOrders: ordersWithPayments.length,
      totalSpent: ordersWithPayments.reduce((sum, order) => sum + order.pricing.total, 0),
      recentOrders: ordersWithPayments.slice(0, 5), // Last 5 orders
      founderMember: userRecord?.is_founding_member || false,
      joinDate: profile?.created_at || ordersWithPayments[0]?.createdAt || new Date().toISOString()
    }

    // Check if user actually has a Founder's Club/Circle order
    const hasFoundersOrder = ordersWithPayments.some((order: any) =>
      order.cardConfig?.planType === 'founders-club' ||
      order.cardConfig?.planType === 'founders-circle'
    );

    const userData = {
      id: profile?.id || email, // Use profile ID or email as fallback
      email,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      phone_number: profile?.phone_number,
      email_verified: profile?.email_verified || false,
      mobile_verified: profile?.mobile_verified || false,
      role: profile?.role || 'user',
      created_at: profile?.created_at || new Date().toISOString(),
      is_founding_member: userRecord?.is_founding_member || false,
      has_founders_order: hasFoundersOrder,
      founding_member_since: userRecord?.founding_member_since || null,
      founding_member_plan: userRecord?.founding_member_plan || null
    }

    console.log(`✅ Account data retrieved: ${ordersWithPayments.length} orders, $${stats.totalSpent.toFixed(2)} total`)

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        orders: ordersWithPayments,
        stats
      }
    })

  } catch (error) {
    console.error('💥 Account API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch account data' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const authSession = await getCurrentUser(request)
    const user = authSession?.user
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, profile } = body
    const targetEmail = email || user.email

    // Only allow users to update their own profile (unless admin)
    if (targetEmail !== user.email && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    console.log(`📝 Updating profile for: ${targetEmail}`)

    // Update user profile in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        email: targetEmail,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone_number: profile.phoneNumber,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Profile updated successfully')

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('💥 Profile update API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      },
      { status: 500 }
    )
  }
}