import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Retrieve a specific order belonging to a specific user.
 *
 * Security:
 * - Requires an authenticated User JWT at the Gateway.
 * - Requires the ORDER_READ permission.
 * - The authenticated user identity is propagated to the Market service
 *   through the Internal JWT.
 * - The Market service must enforce ownership of the requested order.
 */
export const marketUserOrderByIdRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/users/:userId/orders/:orderId',
    GatewayTarget.MARKET,
    '/api/users/:userId/orders/:orderId',
    GatewayAuthMode.JWT,
    [PERMISSION_SLUGS.ORDER_READ],
  );