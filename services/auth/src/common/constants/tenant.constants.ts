export const TENANT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const;

export type TenantStatus =
  (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export const TENANT_TYPE = {
  MARKET: 'markets',
  VET: 'vets',
  PHARMACY: 'pharmacies',
} as const;

export type TenantType =
  (typeof TENANT_TYPE)[keyof typeof TENANT_TYPE];
