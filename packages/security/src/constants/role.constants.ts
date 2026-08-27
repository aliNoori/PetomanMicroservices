/**
 * Application roles used by the authorization layer.
 *
 * IMPORTANT:
 *
 * Role scope is determined by the UserRole assignment:
 *
 * SUPER_ADMIN
 *   -> system role
 *   -> userRole.tenantId === null
 *
 * TENANT_ADMIN
 *   -> tenant-scoped role
 *   -> userRole.tenantId === current JWT tenantId
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const TENANT_ROLES = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  STAFF: 'STAFF',
} as const;

export type SystemRole =
  (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export type TenantRole =
  (typeof TENANT_ROLES)[keyof typeof TENANT_ROLES];

export type AppRole = SystemRole | TenantRole;
