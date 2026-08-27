export const PERMISSION_SLUGS = {
  USER_READ: 'user.read',
  
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_APPROVE: 'tenant.approve',

  TENANT_MEMBERSHIP_REQUEST: 'tenant.membership.request',
  TENANT_MEMBERSHIP_READ: 'tenant.membership.read',
  TENANT_MEMBERSHIP_APPROVE: 'tenant.membership.approve',
  TENANT_MEMBERSHIP_REJECT: 'tenant.membership.reject',

  TENANT_ROLE_READ: 'tenant.role.read',
  TENANT_ROLE_ASSIGN: 'tenant.role.assign',
  TENANT_ROLE_REMOVE: 'tenant.role.remove',
} as const;

export type PermissionSlug =
  (typeof PERMISSION_SLUGS)[keyof typeof PERMISSION_SLUGS];
