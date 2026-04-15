// Production-ready authentication middleware using Supabase
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionStore } from './session-store'

// Supabase client for resolving admin users from JWT sessions
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Explicit allowlist of roles that can access the admin panel
const ADMIN_ROLES = new Set([
  'super_admin',
  'admin',
  'operations_admin',
  'customer_support_admin',
  'finance_admin',
  'marketing_admin',
  'product_tech_admin',
  'fulfilment_admin',
  'manager',
  'moderator',
  'support',
  'viewer',
])

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && ADMIN_ROLES.has(role)
}

// ============================================================
// IN-MEMORY AUTH CACHE
// Caches getAuthenticatedUser() results for 60 seconds per session.
// Eliminates 3-5 repeated DB queries on every request.
// Cache is automatically invalidated on logout (session deletion).
// ============================================================
interface CachedAuth {
  result: AuthSession
  timestamp: number
}
const AUTH_CACHE = new Map<string, CachedAuth>()
const AUTH_CACHE_TTL = 60 * 1000 // 60 seconds

function getCachedAuth(sessionId: string): AuthSession | null {
  const cached = AUTH_CACHE.get(sessionId)
  if (!cached) return null
  if (Date.now() - cached.timestamp > AUTH_CACHE_TTL) {
    AUTH_CACHE.delete(sessionId)
    return null
  }
  return cached.result
}

function setCachedAuth(sessionId: string, result: AuthSession): void {
  // Prevent unbounded cache growth — evict oldest entries if over 500
  if (AUTH_CACHE.size > 500) {
    const oldest = AUTH_CACHE.keys().next().value
    if (oldest) AUTH_CACHE.delete(oldest)
  }
  AUTH_CACHE.set(sessionId, { result, timestamp: Date.now() })
}

/** Call on logout or session invalidation to immediately clear cached auth */
export function invalidateAuthCache(sessionId: string): void {
  AUTH_CACHE.delete(sessionId)
}

// Auth configuration
const AUTH_CONFIG: {
  adminRoutes: string[];
  protectedRoutes: string[];
  publicRoutes: string[];
  adminApiRoutes: string[];
  protectedApiRoutes: string[];
  publicApiRoutes: string[];
  sessionDuration: number;
} = {
  // Protected admin routes
  adminRoutes: ['/admin'],
  // Protected user routes
  protectedRoutes: ['/account', '/dashboard', '/profile-dashboard'],
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
    // Check in-memory cache first (keyed by session cookie)
    const sessionCookie = request.cookies.get('session')?.value
    const adminCookie = request.cookies.get('admin_session')?.value
    const cacheKey = adminCookie || sessionCookie
    if (cacheKey) {
      const cached = getCachedAuth(cacheKey)
      if (cached) return cached
    }

    // Check for custom session cookie (from OTP login) FIRST — it has actual user data + module permissions
    const customSessionId = sessionCookie

    if (customSessionId) {
      const sessionData = await SessionStore.get(customSessionId)

      if (sessionData) {
        // Auto-refresh session if it expires within 30 days AND hasn't been refreshed in the last 24h.
        // This avoids an UPDATE query on every single request.
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sessionAge = Date.now() - sessionData.createdAt;
        const timeSinceLastPossibleRefresh = sessionAge % oneDayMs; // approximate daily gate
        if (sessionData.expiresAt < thirtyDaysFromNow && timeSinceLastPossibleRefresh < 60000) {
          // Refresh session in the background (non-blocking), roughly once per day
          SessionStore.refresh(customSessionId).catch(err => {
            console.warn('Failed to refresh session:', err);
          });
        }

        // ── Parallel: fetch user details + RBAC permissions at once ──
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const [userDataResult, permsResult, moduleAccessResult] = await Promise.all([
          adminClient
            .from('users')
            .select('first_name, last_name, status, is_founding_member, founding_member_since, founding_member_plan')
            .eq('id', sessionData.userId)
            .maybeSingle(),
          adminClient
            .from('user_permissions_view')
            .select('role_name, role_display_name, module, action')
            .eq('user_id', sessionData.userId),
          adminClient
            .from('user_module_access')
            .select('module_key')
            .eq('user_id', sessionData.userId),
        ])

        // Process user details
        let firstName: string | null = null
        let lastName: string | null = null
        let userStatus: 'pending' | 'active' | 'suspended' = 'active'
        let isFoundingMember: boolean = false
        let foundingMemberSince: string | null = null
        let foundingMemberPlan: string | null = null

        const userData = userDataResult.data
        if (userData) {
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
              userStatus = 'active'
            }
          }
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

        // Process RBAC permissions (already fetched in parallel)
        const userPerms = permsResult.data
        if (userPerms && userPerms.length > 0) {
          sessionUser.db_role_name = userPerms[0].role_name
          sessionUser.db_role_display = userPerms[0].role_display_name
          sessionUser.role = userPerms[0].role_name
          sessionUser.db_permissions = userPerms.map(p => `${p.action}:${p.module}`)
        }

        // Process per-user module access (already fetched in parallel)
        if (sessionUser.role !== 'super_admin') {
          const moduleAccess = moduleAccessResult.data
          if (moduleAccess && moduleAccess.length > 0) {
            const MODULE_TO_PERMISSIONS: Record<string, string[]> = {
              customers: ['read:customers', 'create:customers', 'update:customers', 'delete:customers', 'manage:customers', 'export:customers'],
              orders: ['read:orders', 'create:orders', 'update:orders', 'delete:orders', 'manage:orders', 'export:orders'],
              products: ['read:products', 'create:products', 'update:products', 'delete:products', 'manage:products'],
              vouchers: ['read:vouchers', 'create:vouchers', 'update:vouchers', 'delete:vouchers', 'manage:vouchers'],
              subscribers: ['read:subscribers', 'manage:subscribers', 'export:subscribers'],
              founders: ['read:founders', 'approve:founders', 'manage:founders'],
              analytics: ['read:analytics', 'export:analytics', 'manage:analytics'],
              communications: ['read:communications', 'create:communications', 'update:communications', 'delete:communications', 'manage:communications'],
              users: ['read:users', 'create:users', 'update:users', 'delete:users', 'manage:users'],
              roles: ['read:roles', 'manage:roles'],
              settings: ['read:settings', 'update:settings', 'manage:settings'],
            }

            const modulePermissions: string[] = [
              'read:dashboard',
              'manage:dashboard',
            ]

            for (const row of moduleAccess) {
              const perms = MODULE_TO_PERMISSIONS[row.module_key]
              if (perms) modulePermissions.push(...perms)
            }

            sessionUser.db_permissions = modulePermissions
          }
        }

        const sessionResult: AuthSession = {
          user: sessionUser,
          isAuthenticated: true,
          isAdmin: isAdminRole(sessionUser.role),
          sessionId: customSessionId,
        }
        if (customSessionId) setCachedAuth(customSessionId, sessionResult)
        return sessionResult
      }
    }

    // Fallback: check for admin session JWT (secondary admin panel gate)
    const adminSessionId = adminCookie
    const adminVerify = await verifyAdminSession(adminSessionId)

    if (adminVerify.valid) {
      // Resolve the real admin user from DB using the userId embedded in the JWT
      let adminUser: AuthUser | null = null

      if (adminVerify.userId) {
        const { data: dbUser } = await supabaseService
          .from('users')
          .select('id, email, role, status, email_verified, created_at, first_name, last_name')
          .eq('id', adminVerify.userId)
          .single()

        if (dbUser) {
          adminUser = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role || 'admin',
            status: dbUser.status,
            email_verified: dbUser.email_verified,
            created_at: dbUser.created_at,
            first_name: dbUser.first_name,
            last_name: dbUser.last_name,
          }
        }
      }

      // If no userId in JWT (legacy token) or user not found, create a minimal admin identity
      if (!adminUser) {
        adminUser = {
          id: crypto.randomUUID(),
          email: 'admin@linkist.com',
          role: 'admin',
          email_verified: true,
          created_at: new Date().toISOString(),
        }
      }

      const adminResult: AuthSession = {
        user: adminUser,
        isAuthenticated: true,
        isAdmin: true,
        sessionId: adminCookie,
      }
      if (adminCookie) setCachedAuth(adminCookie, adminResult)
      return adminResult
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

    const supabaseResult: AuthSession = {
      user: authUser,
      isAuthenticated: true,
      isAdmin: false,
      sessionId: user.id,
    }
    setCachedAuth(user.id, supabaseResult)
    return supabaseResult

  } catch (error) {
    console.error('Auth middleware error:', error)
    return { user: null, isAuthenticated: false, isAdmin: false }
  }
}

// Verify admin session JWT and return payload (includes sub = userId if present)
async function verifyAdminSession(sessionId?: string): Promise<{ valid: boolean; userId?: string }> {
  if (!sessionId) return { valid: false }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set')
      return { valid: false }
    }
    const secret = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(sessionId, secret)
    return { valid: true, userId: payload.sub as string | undefined }
  } catch {
    return { valid: false }
  }
}

// Create admin session token
export async function createAdminSession(userId?: string): Promise<string> {
  try {
    const { SignJWT } = await import('jose')
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set')
    }
    const secret = new TextEncoder().encode(jwtSecret)

    return await new SignJWT({
      role: 'admin',
      created: Date.now(),
      ...(userId ? { sub: userId } : {}),
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
  // Allow access for: super_admin, admin, any staff role, or any user with RBAC permissions
  if (authRequirement === 'admin') {
    const userRole = session.user?.db_role_name || session.user?.role || 'user'
    const hasDbPermissions = session.user?.db_permissions && session.user.db_permissions.length > 0
    const canAccess = session.isAdmin || (session.isAuthenticated && (isAdminRole(userRole) || hasDbPermissions))

    if (!canAccess) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return Response.json(
          { error: 'Admin access required' },
          { status: 401 }
        )
      }

      // For page routes, redirect to admin access page
      const loginUrl = new URL('/super-admin', request.url)
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
    const hasDbPermissions = session.user?.db_permissions && session.user.db_permissions.length > 0
    const canAccess = session.isAdmin || (session.isAuthenticated && (isAdminRole(userRole) || hasDbPermissions))

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