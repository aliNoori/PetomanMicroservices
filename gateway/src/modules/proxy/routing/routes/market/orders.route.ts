import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Retrieve orders available within the current tenant context.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the ORDER_READ permission.
 * - The authenticated tenant context is propagated to the
 *   Market service through the Internal JWT.
 * - Tenant isolation must be enforced by the Market service.
 */
export const marketOrdersRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/orders',
    GatewayTarget.MARKET,
    '/api/orders',
    GatewayAuthMode.JWT,
    [PERMISSION_SLUGS.ORDER_READ],
  );

/**
 * Create a new order within the current tenant context.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the ORDER_CREATE permission.
 * - The authenticated user and tenant context are propagated
 *   to the Market service through the Internal JWT.
 * - The Market service must derive the order owner from the
 *   authenticated internal identity rather than trusting a
 *   client-supplied user identity.
 */
export const marketCreateOrderRoute =
  GatewayRouteFactory.proxy(
    'POST',
    '/orders',
    GatewayTarget.MARKET,
    '/api/orders',
    GatewayAuthMode.JWT,
    [PERMISSION_SLUGS.ORDER_CREATE],
  );

/**
 * Retrieve a specific order within the current tenant context.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the ORDER_READ permission.
 * - The Market service must verify that the requested order
 *   belongs to the authenticated tenant.
 * - Resource ownership must be enforced downstream where
 *   applicable.
 */
export const marketOrderByIdRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/orders/:orderId',
    GatewayTarget.MARKET,
    '/api/orders/:orderId',
    GatewayAuthMode.JWT,
    [PERMISSION_SLUGS.ORDER_READ],
  );