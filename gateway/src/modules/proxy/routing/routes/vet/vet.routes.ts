import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

export const vetRoutes = [
  GatewayRouteFactory.proxy(
    'GET',
    '/vets',
    GatewayTarget.VET,
    '/vets',
    GatewayAuthMode.JWT,
  ),

  GatewayRouteFactory.proxy(
    'GET',
    '/vets/:vetId',
    GatewayTarget.VET,
    '/vets/:vetId',
    GatewayAuthMode.JWT,
  ),

  GatewayRouteFactory.proxy(
    'GET',
    '/vets/:vetId/appointments',
    GatewayTarget.VET,
    '/vets/:vetId/appointments',
    GatewayAuthMode.JWT,
  ),
];