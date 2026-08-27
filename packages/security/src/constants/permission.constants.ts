export const PERMISSION_SLUGS = {
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',

  TENANT_MEMBERSHIP_READ:
    'tenant.membership.read',

  TENANT_MEMBERSHIP_APPROVE:
    'tenant.membership.approve',

  TENANT_MEMBERSHIP_REJECT:
    'tenant.membership.reject',

  TENANT_ROLE_READ:
    'tenant.role.read',

  TENANT_ROLE_ASSIGN:
    'tenant.role.assign',

  TENANT_ROLE_REMOVE:
    'tenant.role.remove',

  TENANT_APPROVE:
    'tenant.approve',
} as const;

export type PermissionSlug =
  (typeof PERMISSION_SLUGS)[keyof typeof PERMISSION_SLUGS];