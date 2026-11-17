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

  /**
 * Retrieve publicly available products across all active stores.
 *
 * Security:
 * - No user JWT authentication is required.
 * - Active tenant IDs are resolved internally by Auth.
 * - The Gateway uses a global internal service token for Market.
 * - Market must enforce active tenant and product stock visibility.
 */
export const aggregationMarketHomeProductsRoute =
  GatewayRouteFactory.aggregation(
    'GET',
    '/api/market/public/home-products',
    'MARKET_HOME_PRODUCTS',
    GatewayAuthMode.PUBLIC,
  );