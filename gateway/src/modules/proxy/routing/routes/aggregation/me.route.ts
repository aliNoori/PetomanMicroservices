import { GatewayAuthMode } from '../../gateway-route.types';

import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

/**
 * Retrieve aggregated information for the currently authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The aggregation handler must derive the user identity
 *   from the authenticated request context.
 * - No client-supplied userId is used by this route.
 */
export const aggregationMeRoute =
  GatewayRouteFactory.aggregation(
    'GET',
    '/api/me',
    'ME',
    GatewayAuthMode.JWT,
  );