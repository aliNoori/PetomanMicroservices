import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

export const marketOrdersRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/orders',
    GatewayTarget.MARKET,
    '/api/orders',
    GatewayAuthMode.JWT,
  );

export const marketCreateOrderRoute =
  GatewayRouteFactory.proxy(
    'POST',
    '/orders',
    GatewayTarget.MARKET,
    '/api/orders',
    GatewayAuthMode.JWT,
  );

export const marketOrderByIdRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/orders/:orderId',
    GatewayTarget.MARKET,
    '/api/orders/:orderId',
    GatewayAuthMode.JWT,
  );