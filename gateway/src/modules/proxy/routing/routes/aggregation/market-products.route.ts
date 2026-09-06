import { GatewayAuthMode } from '../../gateway-route.types';

import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

/**
 * Retrieve publicly available Market products.
 *
 * This route intentionally does not require User JWT authentication
 * because it represents the public storefront.
 *
 * Security:
 * - No user authentication is required at the Gateway.
 * - The aggregation handler must not rely on authenticated user context.
 * - Store and product visibility rules must be enforced by the
 *   downstream Market service.
 * - Only products explicitly marked as publicly visible should
 *   be returned.
 */
export const aggregationMarketProductsRoute =
  GatewayRouteFactory.aggregation(
    'GET',
    '/api/market/public/products',
    'MARKET_PRODUCTS',
    GatewayAuthMode.PUBLIC,
  );