import { GatewayAuthMode } from '../../gateway-route.types';
import {
  GatewayRouteFactory,
} from '../../registry/gateway-route.factory';


export const aggregationMeRoute =
  GatewayRouteFactory.aggregation(
    'GET',
    '/api/me',
    'ME',
    GatewayAuthMode.JWT,
  );