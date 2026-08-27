import type { Request } from 'express';

import type { JwtPayload } from '../jwt/jwt.types';

/**
 * Express request enriched with the authenticated
 * user's JWT context.
 *
 * IMPORTANT:
 *
 * This request type is intended for endpoints protected
 * by JwtAuthGuard.
 *
 * JwtAuthGuard guarantees that `user` is populated
 * before the controller is executed.
 */
export interface AuthenticatedRequest extends Request {
  /**
   * Validated JWT payload.
   *
   * `tenantId` may be:
   *
   * - null    -> authenticated without Tenant context
   * - UUID    -> authenticated inside a Tenant context
   */
  user: JwtPayload;
}