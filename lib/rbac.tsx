// Linkist NFC — Role-Based Access Control (RBAC)
// Database-driven with hardcoded fallback
import React from 'react'
import { AuthUser } from './auth-middleware'

// ============================================================
// PERMISSIONS — format: "action:module"
// Matches actual Linkist NFC modules
// ============================================================

export enum Permission {
  // --- Dashboard ---
  READ_DASHBOARD = 'read:dashboard',
  MANAGE_DASHBOARD = 'manage:dashboard',

  // --- Orders ---
  CREATE_ORDERS = 'create:orders',
  READ_ORDERS = 'read:orders',
  UPDATE_ORDERS = 'update:orders',
  DELETE_ORDERS = 'delete:orders',
  MANAGE_ORDERS = 'manage:orders',
  EXPORT_ORDERS = 'export:orders',

  // --- Customers ---
  CREATE_CUSTOMERS = 'create:customers',
  READ_CUSTOMERS = 'read:customers',
  UPDATE_CUSTOMERS = 'update:customers',
  DELETE_CUSTOMERS = 'delete:customers',
  MANAGE_CUSTOMERS = 'manage:customers',
  EXPORT_CUSTOMERS = 'export:customers',

  // --- Products ---
  CREATE_PRODUCTS = 'create:products',
  READ_PRODUCTS = 'read:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',
  MANAGE_PRODUCTS = 'manage:products',

  // --- Vouchers ---
  CREATE_VOUCHERS = 'create:vouchers',
  READ_VOUCHERS = 'read:vouchers',
  UPDATE_VOUCHERS = 'update:vouchers',
  DELETE_VOUCHERS = 'delete:vouchers',
  MANAGE_VOUCHERS = 'manage:vouchers',

  // --- Founders Circle ---
  READ_FOUNDERS = 'read:founders',
  APPROVE_FOUNDERS = 'approve:founders',
  MANAGE_FOUNDERS = 'manage:founders',

  // --- Analytics ---
  READ_ANALYTICS = 'read:analytics',
  EXPORT_ANALYTICS = 'export:analytics',
  MANAGE_ANALYTICS = 'manage:analytics',

  // --- Users ---
  CREATE_USERS = 'create:users',
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  MANAGE_USERS = 'manage:users',

  // --- Subscribers ---
  READ_SUBSCRIBERS = 'read:subscribers',
  MANAGE_SUBSCRIBERS = 'manage:subscribers',
  EXPORT_SUBSCRIBERS = 'export:subscribers',

  // --- Communications ---
  CREATE_COMMUNICATIONS = 'create:communications',
  READ_COMMUNICATIONS = 'read:communications',
  UPDATE_COMMUNICATIONS = 'update:communications',
  DELETE_COMMUNICATIONS = 'delete:communications',
  MANAGE_COMMUNICATIONS = 'manage:communications',

  // --- Settings ---
  READ_SETTINGS = 'read:settings',
  UPDATE_SETTINGS = 'update:settings',
  MANAGE_SETTINGS = 'manage:settings',

  // --- Legacy aliases ---
  VIEW_ORDERS = 'read:orders',
  VIEW_CUSTOMERS = 'read:customers',
  VIEW_USERS = 'read:users',
  VIEW_STATS = 'read:analytics',
  VIEW_LOGS = 'read:analytics',
  ASSIGN_ROLES = 'manage:users',
  SYSTEM_SETTINGS = 'manage:settings',
  SEND_EMAILS = 'create:communications',
  VIEW_EMAIL_LOGS = 'read:communications',
  READ_ROLES = 'read:roles',
  UPLOAD_FILES = 'create:orders',
  DELETE_FILES = 'delete:orders',
  VIEW_FILES = 'read:orders',
}

// ============================================================
// MODULES & ACTIONS (for permission matrix UI)
// ============================================================

export const MODULES = [
  { key: 'dashboard',      label: 'Dashboard' },
  { key: 'orders',         label: 'Orders' },
  { key: 'customers',      label: 'Customers' },
  { key: 'products',       label: 'Products' },
  { key: 'vouchers',       label: 'Vouchers' },
  { key: 'founders',       label: 'Founders Circle' },
  { key: 'analytics',      label: 'Analytics' },
  { key: 'users',          label: 'Users' },
  { key: 'subscribers',    label: 'Subscribers' },
  { key: 'communications', label: 'Communications' },
  { key: 'roles',          label: 'Roles' },
  { key: 'settings',       label: 'Settings' },
] as const;

export const ACTIONS = [
  { key: 'create',  label: 'Create' },
  { key: 'read',    label: 'Read' },
  { key: 'update',  label: 'Update' },
  { key: 'delete',  label: 'Delete' },
  { key: 'manage',  label: 'Manage' },
  { key: 'approve', label: 'Approve' },
  { key: 'export',  label: 'Export' },
] as const;

// ============================================================
// ROLE TYPES
// ============================================================

export type RoleName = 'super_admin' | 'admin' | 'operations_admin' | 'customer_support_admin' | 'finance_admin' | 'marketing_admin' | 'product_tech_admin' | 'fulfilment_admin' | 'user';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  permissions?: string[];
}

// ============================================================
// HARDCODED FALLBACK
// ============================================================

const FALLBACK_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(Permission),
  admin: Object.values(Permission).filter(
    p => !['manage:roles', 'delete:roles', 'manage:settings'].includes(p)
  ),
  operations_admin: [
    Permission.READ_DASHBOARD,
    Permission.CREATE_ORDERS, Permission.READ_ORDERS, Permission.UPDATE_ORDERS,
    Permission.DELETE_ORDERS, Permission.MANAGE_ORDERS, Permission.EXPORT_ORDERS,
    Permission.READ_CUSTOMERS, Permission.UPDATE_CUSTOMERS,
    Permission.READ_VOUCHERS, Permission.UPDATE_VOUCHERS,
    Permission.READ_FOUNDERS, Permission.APPROVE_FOUNDERS, Permission.MANAGE_FOUNDERS,
    Permission.READ_ANALYTICS, Permission.EXPORT_ANALYTICS,
  ],
  customer_support_admin: [
    Permission.READ_DASHBOARD,
    Permission.READ_ORDERS, Permission.UPDATE_ORDERS,
    Permission.READ_CUSTOMERS, Permission.UPDATE_CUSTOMERS, Permission.MANAGE_CUSTOMERS,
    Permission.READ_VOUCHERS,
    Permission.READ_FOUNDERS,
    Permission.READ_COMMUNICATIONS,
  ],
  finance_admin: [
    Permission.READ_DASHBOARD,
    Permission.READ_ORDERS, Permission.EXPORT_ORDERS,
    Permission.READ_CUSTOMERS, Permission.EXPORT_CUSTOMERS,
    Permission.READ_ANALYTICS, Permission.EXPORT_ANALYTICS, Permission.MANAGE_ANALYTICS,
    Permission.READ_VOUCHERS,
  ],
  marketing_admin: [
    Permission.READ_DASHBOARD,
    Permission.CREATE_COMMUNICATIONS, Permission.READ_COMMUNICATIONS, Permission.UPDATE_COMMUNICATIONS,
    Permission.DELETE_COMMUNICATIONS, Permission.MANAGE_COMMUNICATIONS,
    Permission.READ_SUBSCRIBERS, Permission.MANAGE_SUBSCRIBERS, Permission.EXPORT_SUBSCRIBERS,
    Permission.READ_ANALYTICS, Permission.EXPORT_ANALYTICS,
    Permission.READ_CUSTOMERS,
  ],
  product_tech_admin: [
    Permission.READ_DASHBOARD,
    Permission.CREATE_PRODUCTS, Permission.READ_PRODUCTS, Permission.UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCTS, Permission.MANAGE_PRODUCTS,
    Permission.READ_SETTINGS, Permission.UPDATE_SETTINGS, Permission.MANAGE_SETTINGS,
    Permission.READ_ANALYTICS,
  ],
  fulfilment_admin: [
    Permission.READ_DASHBOARD,
    Permission.READ_ORDERS, Permission.UPDATE_ORDERS, Permission.EXPORT_ORDERS,
    Permission.READ_CUSTOMERS,
    Permission.READ_FOUNDERS,
  ],
  user: [
    Permission.READ_ORDERS,
  ],
};

// ============================================================
// EXTENDED AUTH USER
// ============================================================

export interface AuthUserWithPermissions extends AuthUser {
  db_permissions?: string[];
  db_role_name?: string;
  db_role_display?: string;
}

// ============================================================
// RBAC CLASS
// ============================================================

export class RBAC {
  static getUserPermissions(user: AuthUserWithPermissions | AuthUser | null): string[] {
    if (!user) return [];
    const dbPerms = (user as AuthUserWithPermissions).db_permissions;
    if (dbPerms && dbPerms.length > 0) return dbPerms;
    const role = (user as AuthUserWithPermissions).db_role_name || user.role || 'user';
    return FALLBACK_ROLE_PERMISSIONS[role] || FALLBACK_ROLE_PERMISSIONS['user'] || [];
  }

  static hasPermission(user: AuthUserWithPermissions | AuthUser | null, permission: string): boolean {
    if (!user) return false;
    const role = (user as AuthUserWithPermissions).db_role_name || user.role;
    if (role === 'super_admin') return true;
    return this.getUserPermissions(user).includes(permission);
  }

  static hasAnyPermission(user: AuthUserWithPermissions | AuthUser | null, permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(user, p));
  }

  static hasAllPermissions(user: AuthUserWithPermissions | AuthUser | null, permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(user, p));
  }

  static isSuperAdmin(user: AuthUserWithPermissions | AuthUser | null): boolean {
    if (!user) return false;
    return ((user as AuthUserWithPermissions).db_role_name || user.role) === 'super_admin';
  }

  static isAdmin(user: AuthUserWithPermissions | AuthUser | null): boolean {
    if (!user) return false;
    const role = (user as AuthUserWithPermissions).db_role_name || user.role;
    return role === 'super_admin' || role === 'admin';
  }

  static isModerator(user: AuthUserWithPermissions | AuthUser | null): boolean {
    return this.isAdmin(user) || ((user as AuthUserWithPermissions)?.db_role_name || user?.role) === 'moderator';
  }

  static canAccessAdmin(user: AuthUserWithPermissions | AuthUser | null): boolean {
    if (!user) return false;
    const role = (user as AuthUserWithPermissions).db_role_name || user.role;
    const ADMIN_ROLES = new Set(['super_admin', 'admin', 'operations_admin', 'customer_support_admin', 'finance_admin', 'marketing_admin', 'product_tech_admin', 'fulfilment_admin', 'manager', 'moderator', 'support', 'viewer']);
    if (role && ADMIN_ROLES.has(role)) return true;
    // Also grant access if user has any RBAC permissions assigned
    const perms = (user as AuthUserWithPermissions).db_permissions;
    if (perms && perms.length > 0) return true;
    return false;
  }

  static canAccessResource(user: AuthUserWithPermissions | AuthUser | null, resource: string, action: string): boolean {
    return this.hasPermission(user, `${action}:${resource}`);
  }

  static getRoleName(role: string): string {
    const names: Record<string, string> = {
      super_admin: 'Super Admin', admin: 'Admin', user: 'User',
      operations_admin: 'Operations Admin', customer_support_admin: 'Customer Support Admin',
      finance_admin: 'Finance Admin', marketing_admin: 'Marketing Admin',
      product_tech_admin: 'Product / Tech Admin', fulfilment_admin: 'Fulfilment / Logistics Admin',
    };
    return names[role] || role;
  }
}

// ============================================================
// API ROUTE PROTECTION
// ============================================================

export function requirePermission(permission: string) {
  return function(handler: (request: any, user: AuthUser) => Promise<Response>) {
    return async function(request: any) {
      try {
        const user = (request as any).user as AuthUserWithPermissions | null;
        if (!RBAC.hasPermission(user, permission)) {
          return Response.json({ error: `Permission denied: ${permission}` }, { status: 403 });
        }
        return handler(request, user!);
      } catch {
        return Response.json({ error: 'Access control error' }, { status: 500 });
      }
    };
  };
}

// ============================================================
// REACT HOOKS & COMPONENTS
// ============================================================

export function usePermissions(user: AuthUserWithPermissions | AuthUser | null) {
  return {
    hasPermission: (permission: string) => RBAC.hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => RBAC.hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => RBAC.hasAllPermissions(user, permissions),
    isSuperAdmin: () => RBAC.isSuperAdmin(user),
    isAdmin: () => RBAC.isAdmin(user),
    isModerator: () => RBAC.isModerator(user),
    canAccessAdmin: () => RBAC.canAccessAdmin(user),
    getUserPermissions: () => RBAC.getUserPermissions(user),
  };
}

export function PermissionGuard({
  permission, permissions, requireAll = false, user, children, fallback = null,
}: {
  permission?: string; permissions?: string[]; requireAll?: boolean;
  user: AuthUserWithPermissions | AuthUser | null;
  children: React.ReactNode; fallback?: React.ReactNode;
}) {
  let hasAccess = false;
  if (permission) hasAccess = RBAC.hasPermission(user, permission);
  else if (permissions) hasAccess = requireAll ? RBAC.hasAllPermissions(user, permissions) : RBAC.hasAnyPermission(user, permissions);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

export function AdminGuard({ user, children, fallback }: {
  user: AuthUserWithPermissions | AuthUser | null;
  children: React.ReactNode; fallback?: React.ReactNode;
}) {
  return RBAC.canAccessAdmin(user) ? <>{children}</> : <>{fallback}</>;
}

// Backward compat exports
export const PERMISSIONS = Permission;
export const ROLE_PERMISSIONS = FALLBACK_ROLE_PERMISSIONS;
