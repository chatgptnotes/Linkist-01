// Production-ready authentication middleware using Supabase
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionStore } from './session-store'

// Static UUID for PIN-based admin sessions
// Using a well-formed UUID allows database operations that expect UUID type
const ADMIN_SESSION_UUID = '00000000-0000-0000-0000-000000000001'

// Auth configuration
const AUTH_CONFIG: {
  adminRoutes: string[];
  protectedRoutes: string[];
  publicRoutes: string[];
  adminApiRoutes: string[];
  protectedApiRoutes: string[];
  publicApiRoutes: string[];
  sessionDuration: number;
  adminPin: string;
} = {
  // Protected admin routes
  adminRoutes: ['/admin'],
  // Protected user routes
  protectedRoutes: ['/account', '/dashboard'],
  // Public routes that don't need auth
  publicRoutes: ['/', '/login', '/signup', '/verify-login', '/verify-register', '/nfc/configure', '/nfc/checkout', '/nfc/success', '/nfc/payment', '/welcome-to-linkist', '/verify-mobile', '/product-selection', '/choose-plan'],
  // API routes that need admin access
  adminApiRoutes: ['/api/admin'],
  // API routes that need user auth (excluding specific endpoints)
  protectedApiRoutes: ['/api/account'],
  // Public API routes that don't need auth
  publicApiRoutes: ['/api/user/profile'],
  // Session duration
  sessionDuration: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
  // Admin PIN for admin access (in production, this should be more secure)
  adminPin: process.env.ADMIN_PIN || '1234',
}

export interface AuthUser {
  id: string
  email: string
  role: string  // Expanded: 'user' | 'admin' | 'super_admin' | 'doctor' | 'receptionist' | 'marketing_staff' | 'accountant' | 'moderator'
  status?: 'pending' | 'active' | 'suspended'
  email_verified?: boolean
  mobile_verified?: boolean
  created_at?: string
  first_name?: string | null
  last_name?: string | null
  is_founding_member?: boolean
  founding_member_since?: string | null
  founding_member_plan?: string | null
  phone_number?: string | null
  // RBAC fields (loaded from DB)
  db_permissions?: string[]    // e.g. ["create:patients", "read:billing"]
  db_role_name?: string        // e.g. "doctor"
  db_role_display?: string     // e.g. "Doctor"
}

export interface AuthSession {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  sessionId?: string
}

// Create Supabase client for middleware
function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

// Get authenticated user from Supabase session
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthSession> {
  try {
    // First check for admin session (PIN-based admin access)
    const adminSessionId = request.cookies.get('admin_session')?.value
    const isAdminSession = await verifyAdminSession(adminSessionId)

    if (isAdminSession) {
      // Create admin user from session token
      const adminUser: AuthUser = {
        id: ADMIN_SESSION_UUID,
        email: 'admin@linkist.com',
        role: 'admin',
        email_verified: true,
        created_at: new Date().toISOString(),
      }

      return {
        user: adminUser,
        isAuthenticated: true,
        isAdmin: true,
        sessionId: ADMIN_SESSION_UUID,
      }
    }

    // Check for custom session cookie (from OTP login)
    const customSessionId = request.cookies.get('session')?.value

    if (customSessionId) {
      const sessionData = await SessionStore.get(customSessionId)

      if (sessionData) {
        // Auto-refresh session if it expires within 30 days (keeps active users logged in)
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        if (sessionData.expiresAt < thirtyDaysFromNow) {
          // Refresh session in the background (non-blocking)
          SessionStore.refresh(customSessionId).catch(err => {
            console.warn('Failed to refresh session:', err);
          });
        }

        // Fetch user details from database to get first_name, last_name, status, and founding member fields
        let firstName: string | null = null
        let lastName: string | null = null
        let userStatus: 'pending' | 'active' | 'suspended' = 'active'
        let isFoundingMember: boolean = false
        let foundingMemberSince: string | null = null
        let foundingMemberPlan: string | null = null

        try {
          // Use admin client (service_role) to bypass RLS on users table
          // The anon key can't read users table due to RLS requiring auth.uid() match
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
          const { data: userData, error: userError } = await adminClient
            .from('users')
            .select('first_name, last_name, status, is_founding_member, founding_member_since, founding_member_plan')
            .eq('id', sessionData.userId)
            .maybeSingle() // Use maybeSingle to avoid errors if user not found

          if (!userError && userData) {
            firstName = userData.first_name || null
            lastName = userData.last_name || null
            userStatus = userData.status || 'active'
            isFoundingMember = userData.is_founding_member || false
            foundingMemberSince = userData.founding_member_since || null
            foundingMemberPlan = userData.founding_member_plan || null

            // Check if user is suspended - reject session
            if (userStatus === 'suspended') {
              console.warn('Suspended user attempted to access:', sessionData.email)
              return { user: null, isAuthenticated: false, isAdmin: false }
            }

            // If user has a valid session but status is still 'pending', auto-activate them.
            // Having a valid session means they already completed OTP verification successfully.
            // The status was not updated due to a previous bug — self-heal it here.
            if (userStatus === 'pending') {
              console.log('🔄 Auto-activating pending user with valid session:', sessionData.email)
              try {
                await adminClient
                  .from('users')
                  .update({ status: 'active', mobile_verified: true, updated_at: new Date().toISOString() })
                  .eq('id', sessionData.userId)
                userStatus = 'active'
              } catch (activateError) {
                console.error('Failed to auto-activate pending user:', activateError)
                // Don't block the user - let them through since they have a valid session
                userStatus = 'active'
              }
            }
          }
        } catch (error) {
          // Silently fail user data fetch - not critical for auth
          console.warn('Failed to fetch user details:', error)
        }

        // Only allow active users to authenticate
        if (userStatus !== 'active') {
          return { user: null, isAuthenticated: false, isAdmin: false }
        }

        const sessionUser: AuthUser = {
          id: sessionData.userId,
          email: sessionData.email,
          role: sessionData.role,
          status: userStatus,
          email_verified: true,
          created_at: new Date(sessionData.createdAt).toISOString(),
          first_name: firstName,
          last_name: lastName,
          is_founding_member: isFoundingMember,
          founding_member_since: foundingMemberSince,
          founding_member_plan: foundingMemberPlan,
        }

        // Load RBAC permissions from database
        try {
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
          const { data: userPerms } = await adminClient
            .from('user_permissions_view')
            .select('role_name, role_display_name, module, action')
            .eq('user_id', sessionData.userId)

          if (userPerms && userPerms.length > 0) {
            sessionUser.db_role_name = userPerms[0].role_name
            sessionUser.db_role_display = userPerms[0].role_display_name
            sessionUser.role = userPerms[0].role_name // override with DB role
            sessionUser.db_permissions = userPerms.map(p => `${p.action}:${p.module}`)
          }
        } catch (rbacErr) {
          // Non-blocking — falls back to hardcoded RBAC
          console.warn('Failed to load RBAC permissions from DB:', rbacErr)
        }

        return {
          user: sessionUser,
          isAuthenticated: true,
          isAdmin: sessionUser.role === 'admin' || sessionUser.role === 'super_admin',
          sessionId: customSessionId,
        }
      }
    }

    // Check for regular Supabase user session
    const { supabase, response } = createMiddlewareClient(request)

    // Get the current user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, isAuthenticated: false, isAdmin: false }
    }

    // Fetch user details from database for founding member status
    let isFoundingMember: boolean = false
    let foundingMemberSince: string | null = null
    let foundingMemberPlan: string | null = null
    let firstName: string | null = null
    let lastName: string | null = null

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, is_founding_member, founding_member_since, founding_member_plan')
        .eq('id', user.id)
        .maybeSingle()

      if (userData) {
        firstName = userData.first_name || null
        lastName = userData.last_name || null
        isFoundingMember = userData.is_founding_member || false
        foundingMemberSince = userData.founding_member_since || null
        foundingMemberPlan = userData.founding_member_plan || null
      }
    } catch (dbError) {
      console.warn('Failed to fetch user details for Supabase session:', dbError)
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: 'user', // Regular users default to 'user' role
      email_verified: user.email_confirmed_at != null,
      created_at: user.created_at,
      first_name: firstName,
      last_name: lastName,
      is_founding_member: isFoundingMember,
      founding_member_since: foundingMemberSince,
      founding_member_plan: foundingMemberPlan,
    }

    return {
      user: authUser,
      isAuthenticated: true,
      isAdmin: false,
      sessionId: user.id,
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    return { user: null, isAuthenticated: false, isAdmin: false }
  }
}

// Verify admin session (temporary solution using encrypted cookies)
async function verifyAdminSession(sessionId?: string): Promise<boolean> {
  if (!sessionId) return false

  try {
    // In a real app, you'd verify this against a database
    // For now, we'll use a simple time-based token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    await jwtVerify(sessionId, secret)
    return true
  } catch {
    return false
  }
}

// Create admin session token
export async function createAdminSession(): Promise<string> {
  try {
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    
    return await new SignJWT({ 
      role: 'admin',
      created: Date.now() 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)
  } catch (error) {
    console.error('Error creating admin session:', error)
    throw error
  }
}

// Check if route requires authentication
function requiresAuth(pathname: string): 'admin' | 'user' | 'none' {
  // Check if it's a public API route first
  if (AUTH_CONFIG.publicApiRoutes && AUTH_CONFIG.publicApiRoutes.some(route => pathname.startsWith(route))) {
    return 'none'
  }

  // Check admin routes
  if (AUTH_CONFIG.adminRoutes.some(route => pathname.startsWith(route))) {
    return 'admin'
  }

  // Check admin API routes
  if (AUTH_CONFIG.adminApiRoutes.some(route => pathname.startsWith(route))) {
    return 'admin'
  }

  // Check protected user routes
  if (AUTH_CONFIG.protectedRoutes.some(route => pathname.startsWith(route))) {
    return 'user'
  }

  // Check protected API routes
  if (AUTH_CONFIG.protectedApiRoutes.some(route => pathname.startsWith(route))) {
    return 'user'
  }

  // Check if it's any /api/user route (but not in public API routes)
  if (pathname.startsWith('/api/user')) {
    return 'user'
  }

  return 'none'
}

// Main authentication middleware
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public routes and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/stripe-webhook') ||
    pathname.startsWith('/api/process-order') ||
    pathname.startsWith('/api/admin-login') ||
    pathname.startsWith('/api/super-admin-login') ||
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/admin-access') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/api/send-otp') ||
    pathname.startsWith('/api/verify-otp') ||
    pathname.startsWith('/api/send-mobile-otp') ||
    pathname.startsWith('/api/verify-mobile-otp') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  const authRequirement = requiresAuth(pathname)

  if (authRequirement === 'none') {
    return NextResponse.next()
  }

  // Get user authentication status
  const session = await getAuthenticatedUser(request)

  // Handle admin routes
  // Allow access for: super_admin, admin, and any staff role with admin panel access
  if (authRequirement === 'admin') {
    const userRole = session.user?.db_role_name || session.user?.role || 'user'
    const canAccess = session.isAdmin || (session.isAuthenticated && userRole !== 'user')

    if (!canAccess) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return Response.json(
          { error: 'Admin access required' },
          { status: 401 }
        )
      }

      // For page routes, redirect to admin access page
      const loginUrl = new URL('/admin-access', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Authorized staff, allow access
    return NextResponse.next()
  }

  // Handle user routes
  if (authRequirement === 'user') {
    if (!session.isAuthenticated) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Update Supabase session
  const { response } = createMiddlewareClient(request)
  return response
}

// Helper function to get current user in API routes
export async function getCurrentUser(request: NextRequest): Promise<AuthSession> {
  return await getAuthenticatedUser(request)
}

// Helper function to require admin/staff access in API routes
// Allows: super_admin, admin, and any assigned staff role (doctor, receptionist, etc.)
export function requireAdmin(handler: (request: NextRequest, ...args: any[]) => Promise<Response>) {
  return async (request: NextRequest, ...args: any[]) => {
    const session = await getCurrentUser(request)
    const userRole = session.user?.db_role_name || session.user?.role || 'user'
    const canAccess = session.isAdmin || (session.isAuthenticated && userRole !== 'user')

    if (!canAccess) {
      return Response.json(
        { error: 'Admin access required' },
        { status: 401 }
      )
    }

    return handler(request, ...args)
  }
}

// Helper function to require super_admin only
export function requireSuperAdmin(handler: (request: NextRequest, ...args: any[]) => Promise<Response>) {
  return async (request: NextRequest, ...args: any[]) => {
    const session = await getCurrentUser(request)
    const userRole = session.user?.db_role_name || session.user?.role

    if (userRole !== 'super_admin') {
      return Response.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }

    return handler(request, ...args)
  }
}

// Helper function to require auth in API routes
export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const session = await getCurrentUser(request)
    
    if (!session.isAuthenticated || !session.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(request, session.user)
  }
}