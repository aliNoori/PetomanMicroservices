export const TENANT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const;

export type TenantStatus =
  (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];