export const PERMISSION_SLUGS = {
  // User
  USER_READ: 'user.read',

  // Tenant
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_APPROVE: 'tenant.approve',

  // Tenant Membership
  TENANT_MEMBERSHIP_REQUEST: 'tenant.membership.request',
  TENANT_MEMBERSHIP_READ: 'tenant.membership.read',
  TENANT_MEMBERSHIP_APPROVE: 'tenant.membership.approve',
  TENANT_MEMBERSHIP_REJECT: 'tenant.membership.reject',

  // Tenant Roles
  TENANT_ROLE_READ: 'tenant.role.read',
  TENANT_ROLE_ASSIGN: 'tenant.role.assign',
  TENANT_ROLE_REMOVE: 'tenant.role.remove',

  // Product
  PRODUCT_READ: 'product.read',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',

  // Order
  ORDER_READ: 'order.read',
  ORDER_CREATE: 'order.create',
} as const;

export type PermissionSlug =
  (typeof PERMISSION_SLUGS)[keyof typeof PERMISSION_SLUGS];