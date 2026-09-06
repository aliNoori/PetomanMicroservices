import { aggregationMeRoute } from './me.route';

import { aggregationDashboardRoute } from './dashboard.route';

import { aggregationMarketProductsRoute } from './market-products.route';

/**
 * All Gateway aggregation routes.
 *
 * Routes are grouped by aggregation purpose:
 * - Current user
 * - Authenticated dashboard
 * - Public Market products
 *
 * Authentication requirements are defined at the
 * individual route level.
 */
export const aggregationRoutes = [
  // Current User
  aggregationMeRoute,

  // Authenticated Dashboard
  aggregationDashboardRoute,

  // Public Market Products
  aggregationMarketProductsRoute,
];