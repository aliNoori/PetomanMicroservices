import {
  marketOrdersRoute,
  marketCreateOrderRoute,
  marketOrderByIdRoute,
} from './orders.route';

import {
  marketProductsRoute,
  marketCreateProductRoute,
  marketUpdateProductRoute,
  marketDeleteProductRoute,
  marketProductByIdRoute,
  marketPublicProductsRoute,
} from './products.route';

import {
  marketUserOrderByIdRoute,
} from './users.route';

/**
 * All Gateway routes exposed by the Market service.
 *
 * Routes are grouped by resource:
 * - Orders
 * - Products
 * - Public storefront
 * - User-specific orders
 *
 * Authorization and authentication requirements are defined
 * at the individual route level.
 */
export const marketRoutes = [
  // ============================================================
  // Orders
  // ============================================================

  marketOrdersRoute,
  marketCreateOrderRoute,
  marketOrderByIdRoute,

  // ============================================================
  // Products
  // ============================================================

  marketProductsRoute,
  marketCreateProductRoute,
  marketUpdateProductRoute,
  marketDeleteProductRoute,
  marketProductByIdRoute,

  // ============================================================
  // Public Storefront
  // ============================================================

  marketPublicProductsRoute,

  // ============================================================
  // User Orders
  // ============================================================

  marketUserOrderByIdRoute,
];