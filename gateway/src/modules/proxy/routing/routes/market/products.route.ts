import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
  GatewayTenantContext,
  GatewayTenantResolution,
} from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Retrieve products available to the authenticated user within
 * the current tenant context.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the PRODUCT_READ permission.
 * - The Gateway propagates the authenticated user and tenant context
 *   through the Internal JWT.
 * - Tenant isolation must also be enforced by the Market service.
 */
export const marketProductsRoute = GatewayRouteFactory.orchestration(
  'GET',
  '/products',
  'market.products.list',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.PRODUCT_READ],
  GatewayTenantContext.REQUIRED,
  GatewayTarget.MARKET,
);

/**
 * Create a new product within the current tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the PRODUCT_CREATE permission.
 * - The downstream Market service receives the authenticated
 *   tenant context through the Internal JWT.
 */
export const marketCreateProductRoute = GatewayRouteFactory.orchestration(
  'POST',
  '/products',
  'market.products.create',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.PRODUCT_CREATE],
  GatewayTenantContext.REQUIRED,
  GatewayTarget.MARKET,
);

/**
 * Update a product within the current tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the PRODUCT_UPDATE permission.
 * - The product must belong to the authenticated tenant.
 */
export const marketUpdateProductRoute = GatewayRouteFactory.orchestration(
  'PUT',
  '/products/:productId',
  'market.products.update',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.PRODUCT_UPDATE],
  GatewayTenantContext.REQUIRED,
  GatewayTarget.MARKET,
);

/**
 * Delete a product within the current tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the PRODUCT_DELETE permission.
 * - The Market service must verify that the product belongs
 *   to the authenticated tenant before deletion.
 */
export const marketDeleteProductRoute = GatewayRouteFactory.proxy(
  'DELETE',
  '/products/:productId',
  GatewayTarget.MARKET,
  '/api/products/:productId',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.PRODUCT_DELETE],
  'json',
  true,
  GatewayTenantContext.REQUIRED,
);

/**
 * Retrieve a specific product within the current tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the PRODUCT_READ permission.
 * - Tenant isolation must be enforced by the Market service.
 */
export const marketProductByIdRoute = GatewayRouteFactory.orchestration(
  'GET',
  '/products/:productId',
  'market.products.findById',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.PRODUCT_READ],
  GatewayTenantContext.REQUIRED,
  GatewayTarget.MARKET,
);

/**
 * Retrieve publicly available products for a store.
 *
 * This route intentionally does not require User JWT authentication
 * or tenant permissions because it represents the public storefront.
 *
 * Store and product visibility rules must be enforced by the
 * downstream Market service.
 */
export const marketPublicProductsRoute = GatewayRouteFactory.orchestration(
  'GET',
  '/public/stores/:storeSlug/products',
  'market.products.public.list',
  GatewayAuthMode.PUBLIC,
  [],
  GatewayTenantContext.NONE,
  GatewayTarget.MARKET,
);
