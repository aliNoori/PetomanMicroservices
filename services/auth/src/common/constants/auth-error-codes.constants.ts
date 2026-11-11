export const AUTH_ERROR_CODES = {
  // ============================================================
  // Generic
  // ============================================================

  BAD_REQUEST: 'AUTH_BAD_REQUEST',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  NOT_FOUND: 'AUTH_NOT_FOUND',
  CONFLICT: 'AUTH_CONFLICT',
  VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'AUTH_INTERNAL_SERVER_ERROR',

  // ============================================================
  // User
  // ============================================================

  INVALID_CREDENTIALS:
    'AUTH_INVALID_CREDENTIALS',

  USER_NOT_FOUND:
    'AUTH_USER_NOT_FOUND',

  USER_INACTIVE:
    'AUTH_USER_INACTIVE',

  EMAIL_ALREADY_EXISTS:
    'AUTH_EMAIL_ALREADY_EXISTS',

  EMAIL_NOT_VERIFIED:
    'EMAIL_NOT_VERIFIED',

  // ============================================================
  // Tenant
  // ============================================================

  TENANT_NOT_FOUND:
    'AUTH_TENANT_NOT_FOUND',

  TENANT_INACTIVE:
    'AUTH_TENANT_INACTIVE',

  TENANT_CONTEXT_REQUIRED:
    'AUTH_TENANT_CONTEXT_REQUIRED',

  TENANT_MEMBERSHIP_REQUIRED:
    'AUTH_TENANT_MEMBERSHIP_REQUIRED',

  TENANT_MEMBERSHIP_NOT_FOUND:
    'AUTH_TENANT_MEMBERSHIP_NOT_FOUND',

  TENANT_MEMBERSHIP_ALREADY_ACTIVE:
    'AUTH_TENANT_MEMBERSHIP_ALREADY_ACTIVE',

  TENANT_MEMBERSHIP_ALREADY_PENDING:
    'AUTH_TENANT_MEMBERSHIP_ALREADY_PENDING',

  TENANT_MEMBERSHIP_INVALID_STATUS:
    'AUTH_TENANT_MEMBERSHIP_INVALID_STATUS',

  TENANT_SCOPE_FORBIDDEN:
    'AUTH_TENANT_SCOPE_FORBIDDEN',

  TENANT_SLUG_ALREADY_EXISTS:
    'AUTH_TENANT_SLUG_ALREADY_EXISTS',

  // ============================================================
  // Role
  // ============================================================

  ROLE_NOT_FOUND:
    'AUTH_ROLE_NOT_FOUND',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];