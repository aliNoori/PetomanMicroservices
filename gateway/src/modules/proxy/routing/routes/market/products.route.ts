import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

export const marketProductsRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/products',
    GatewayTarget.MARKET,
    '/api/products',
    GatewayAuthMode.JWT,
  );

export const marketProductByIdRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/products/:productId',
    GatewayTarget.MARKET,
    '/api/products/:productId',
    GatewayAuthMode.JWT,
  );