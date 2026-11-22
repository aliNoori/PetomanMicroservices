import {
  GatewayAuthMode,
  GatewayTenantContext,
} from '../../gateway-route.types';

import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

/**
 * Retrieve aggregated dashboard data for the authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The aggregation handler must derive the user identity
 *   and tenant context from the authenticated request.
 * - Client-supplied user or tenant identifiers must not be
 *   trusted for authorization decisions.
 * - Downstream services must enforce tenant isolation
 *   using the propagated Internal JWT context.
 */
export const aggregationDashboardRoute = GatewayRouteFactory.aggregation(
  'GET',
  '/dashboard',
  'DASHBOARD',
  GatewayAuthMode.JWT,
  [],
  GatewayTenantContext.REQUIRED,
);
