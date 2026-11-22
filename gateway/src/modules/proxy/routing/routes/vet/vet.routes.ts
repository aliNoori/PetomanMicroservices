import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
  GatewayTenantContext,
} from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Retrieve available veterinarians.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Tenant isolation must be enforced by the Vet service.
 */
export const vetRoutes = [
  GatewayRouteFactory.proxy(
    'GET',
    '/vets',
    GatewayTarget.VET,
    '/vets',
    GatewayAuthMode.JWT,
    //[PERMISSION_SLUGS.VET_READ],
  ),

  /**
   * Retrieve a specific veterinarian.
   *
   * Tenant and resource access must be validated by the Vet service.
   */
  GatewayRouteFactory.proxy(
    'GET',
    '/vets/:vetId',
    GatewayTarget.VET,
    '/vets/:vetId',
    GatewayAuthMode.JWT,
    //[PERMISSION_SLUGS.VET_READ],
  ),

  /**
   * Retrieve appointments for a veterinarian.
   *
   * Tenant and resource access must be validated by the Vet service.
   */
  GatewayRouteFactory.proxy(
    'GET',
    '/vets/:vetId/appointments',
    GatewayTarget.VET,
    '/vets/:vetId/appointments',
    GatewayAuthMode.JWT,
    [],
    'json',
    true,
    GatewayTenantContext.REQUIRED,
  ),
];
