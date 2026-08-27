import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

export const marketUserOrderRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/users/:userId/orders/:orderId',
    GatewayTarget.MARKET,
    '/api/users/:userId/orders/:orderId',
    GatewayAuthMode.JWT,
  );