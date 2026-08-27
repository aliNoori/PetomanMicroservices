export const ROLE_SLUGS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  STAFF: 'STAFF',
} as const;

export type RoleSlug =
  (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];