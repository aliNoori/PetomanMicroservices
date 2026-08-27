export const SERVICE_NAMES = {
  AUTH: 'auth',
  VET: 'vet',
  FINANCIAL: 'financial',
  MARKET: 'market',
  PHARMACY: 'pharmacy',
} as const;

export type ServiceName =
  (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];