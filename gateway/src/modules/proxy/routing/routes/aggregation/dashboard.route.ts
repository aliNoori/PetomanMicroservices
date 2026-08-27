import { GatewayAuthMode } from '../../gateway-route.types';
import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';


export const aggregationDashboardRoute =
  GatewayRouteFactory.aggregation(
    'GET',
    '/dashboard',
    'DASHBOARD',
    GatewayAuthMode.JWT,
  );