import { GatewayAuthMode, GatewayTarget } from '../../gateway-route.types';
import { GatewayRouteFactory } from '../../registry/gateway-route.factory';


export const redisConnectionTestRoute = GatewayRouteFactory.proxy(
  'GET',
  '/health/redis',
  GatewayTarget.AUTH,
  '/api/auth/health/redis',
  GatewayAuthMode.PUBLIC,
);