import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../types/auth-request.type';

import { ERROR_CODES } from '../constants/error-code.constants';

/**
 * Requires an authenticated Tenant context.
 *
 * This guard must be used AFTER JwtAuthGuard.
 *
 * Authentication:
 *
 *   JwtAuthGuard
 *        ↓
 *   request.user exists
 *
 * Tenant context:
 *
 *   TenantContextGuard
 *        ↓
 *   request.user.tenantId exists
 *
 * IMPORTANT:
 *
 * This guard does NOT:
 *
 * - validate the JWT signature
 * - load the Tenant from database
 * - verify Tenant membership
 * - check roles
 * - check permissions
 *
 * Those responsibilities belong to other layers.
 *
 * The Tenant context was established during:
 *
 *   POST /auth/tenant/select
 *
 * and is represented by:
 *
 *   request.user.tenantId
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    /*
     * ------------------------------------------------------------
     * 1. JwtAuthGuard must run before this guard.
     * ------------------------------------------------------------
     *
     * Since this guard is specifically a Tenant-context guard,
     * a missing user means the authentication layer was skipped
     * or incorrectly configured.
     */
    if (!request.user) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Authenticated user context is required.',
      });
    }

    /*
     * ------------------------------------------------------------
     * 2. Require Tenant context
     * ------------------------------------------------------------
     *
     * tenantId = null means:
     *
     * - User is authenticated
     * - but no Tenant has been selected
     *
     * Such a JWT is valid for global endpoints, but it cannot
     * access endpoints that operate inside a Tenant context.
     */
    if (!request.user.tenantId) {
      throw new ForbiddenException({
        code: 'AUTH_TENANT_CONTEXT_REQUIRED',
        message: 'A Tenant context is required for this endpoint.',
      });
    }

    /*
     * ------------------------------------------------------------
     * 3. Tenant context is available.
     * ------------------------------------------------------------
     */
    return true;
  }
}
