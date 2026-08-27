import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import { GatewayAuthMode, GatewayTarget } from '../../gateway-route.types';

export const authRegisterRoute = GatewayRouteFactory.proxy(
  'POST',
  '/register',
  GatewayTarget.AUTH,
  '/api/auth/register',
  GatewayAuthMode.PUBLIC,
);

export const authLoginRoute = GatewayRouteFactory.proxy(
  'POST',
  '/login',
  GatewayTarget.AUTH,
  '/api/auth/login',
  GatewayAuthMode.PUBLIC,
);

export const authUsersRoute = GatewayRouteFactory.proxy(
  'GET',
  '/users/:userId',
  GatewayTarget.AUTH,
  '/api/auth/users/:userId',
  GatewayAuthMode.JWT,
);

export const authProfileRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/profile',
    GatewayTarget.AUTH,
    '/api/auth/profile',
    GatewayAuthMode.JWT,
  );
