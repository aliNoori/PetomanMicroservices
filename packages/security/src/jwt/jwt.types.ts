/**
 * JWT payload used across Petoman services.
 *
 * Tenant context is optional because a User is a
 * global identity and does not necessarily belong
 * to a Tenant.
 *
 * Examples:
 *
 * Global user:
 *
 * {
 *   sub: 'user-uuid',
 *   email: 'user@example.com',
 *   roles: ['SUPER_ADMIN'],
 *   permissions: []
 * }
 *
 * Tenant-context user:
 *
 * {
 *   sub: 'user-uuid',
 *   tenantId: 'tenant-uuid',
 *   email: 'user@example.com',
 *   roles: ['TENANT_ADMIN'],
 *   permissions: []
 * }
 */
export interface JwtPayload {
  /**
   * Global User UUID.
   */
  sub: string;

  /**
   * Session identifier.
   *
   * Represents the refresh token family associated
   * with the current authenticated session.
   */
  sid: string;

  /**
   * Current tenant context.
   *
   * null means the authenticated user currently has
   * no tenant context.
   *
   * Examples:
   *
   * - system-only user
   * - user without tenant membership
   * - user before tenant selection
   */
  tenantId: string | null;

  /**
   * User roles available in the current context.
   *
   * System roles are included regardless of Tenant.
   * Tenant roles are included only for the selected Tenant.
   */
  roles: string[];

  /**
   * User capabilities/permissions available
   * in the current security context.
   */
  permissions: string[];

  /**
   * User email address.
   */
  email: string;
}
