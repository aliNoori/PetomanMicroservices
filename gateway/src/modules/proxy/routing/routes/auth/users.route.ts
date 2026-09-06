import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Register a new user account.
 *
 * This endpoint is intentionally public because user registration
 * occurs before authentication.
 *
 * The Gateway generates a GLOBAL Internal JWT for the Auth service.
 */
export const authRegisterRoute =
  GatewayRouteFactory.proxy(
    'POST',
    '/register',
    GatewayTarget.AUTH,
    '/api/auth/register',
    GatewayAuthMode.PUBLIC,
  );

/**
 * Authenticate a user and issue a User JWT.
 *
 * This endpoint is intentionally public because authentication
 * must occur before a User JWT exists.
 *
 * The Gateway generates a GLOBAL Internal JWT for the Auth service.
 */
export const authLoginRoute =
  GatewayRouteFactory.proxy(
    'POST',
    '/login',
    GatewayTarget.AUTH,
    '/api/auth/login',
    GatewayAuthMode.PUBLIC,
  );

/**
 * Retrieve another user's information.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the USER_READ permission.
 * - The target userId comes from the trusted route definition.
 * - The Auth service must enforce any additional ownership or
 *   administrative access rules.
 */
export const authUsersRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/users/:userId',
    GatewayTarget.AUTH,
    '/api/auth/users/:userId',
    GatewayAuthMode.JWT,
    [PERMISSION_SLUGS.USER_READ],
  );

/**
 * Retrieve the currently authenticated user's profile.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No explicit permission is required because the endpoint
 *   only exposes the authenticated user's own profile.
 * - The Auth service derives the user identity from the
 *   Internal JWT rather than trusting a client-supplied userId.
 */
export const authProfileRoute =
  GatewayRouteFactory.proxy(
    'GET',
    '/profile',
    GatewayTarget.AUTH,
    '/api/auth/profile',
    GatewayAuthMode.JWT,
  );