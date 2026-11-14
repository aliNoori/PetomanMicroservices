import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import { GatewayAuthMode, GatewayTarget } from '../../gateway-route.types';

import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

/**
 * Register a new user account.
 *
 * This endpoint is intentionally public because user registration
 * occurs before authentication.
 *
 * The Gateway generates a GLOBAL Internal JWT for the Auth service.
 */
export const authRegisterRoute = GatewayRouteFactory.proxy(
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
export const authLoginRoute = GatewayRouteFactory.proxy(
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
export const authUsersRoute = GatewayRouteFactory.proxy(
  'GET',
  '/users/:userId',
  GatewayTarget.AUTH,
  '/api/auth/users/:userId',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.USER_READ],
);

/**
 * Retrieve tenants waiting for administrative approval.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_APPROVE permission.
 * - The Auth service independently verifies GLOBAL scope
 *   and the SUPER_ADMIN system role.
 */
export const authPendingTenantsRoute = GatewayRouteFactory.proxy(
  'GET',
  '/tenants/pending',
  GatewayTarget.AUTH,
  '/api/auth/tenants/pending',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_APPROVE],
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
export const authProfileRoute = GatewayRouteFactory.proxy(
  'GET',
  '/profile',
  GatewayTarget.AUTH,
  '/api/auth/profile',
  GatewayAuthMode.JWT,
);

/**
 * Upload or replace the authenticated user's profile avatar.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The Gateway derives the user identity from the verified token.
 * - The Auth service uses the trusted Internal JWT identity.
 * - Multipart file data is streamed to the Auth service.
 */
export const authUpdateProfileAvatarRoute = GatewayRouteFactory.proxy(
  'PATCH',
  '/profile/avatar',
  GatewayTarget.AUTH,
  '/api/auth/profile/avatar',
  GatewayAuthMode.JWT,
);

/**
 * Refresh the current authentication session.
 *
 * Security:
 * - Public from the user's perspective.
 * - Requires Gateway-generated Internal JWT.
 * - Does not require a valid User JWT because
 *   the access token may already be expired.
 */
export const authRefreshRoute = GatewayRouteFactory.proxy(
  'POST',
  '/refresh',
  GatewayTarget.AUTH,
  '/api/auth/refresh',
  GatewayAuthMode.PUBLIC,
);

/**
 * Retrieve sessions belonging to the authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No explicit permission is required.
 * - The Auth service scopes the result to the authenticated user.
 */
export const authSessionsRoute = GatewayRouteFactory.proxy(
  'GET',
  '/sessions',
  GatewayTarget.AUTH,
  '/api/auth/sessions',
  GatewayAuthMode.JWT,
);

/**
 * Revoke a session belonging to the authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The Auth service verifies session ownership.
 */
export const authRevokeSessionRoute = GatewayRouteFactory.proxy(
  'DELETE',
  '/sessions/:sessionId',
  GatewayTarget.AUTH,
  '/api/auth/sessions/:sessionId',
  GatewayAuthMode.JWT,
);

/**
 * Delete the history of an inactive session.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The Auth service verifies session ownership.
 * - Active sessions cannot be deleted.
 * - All refresh token records belonging to the session
 *   family are permanently deleted.
 */
export const authDeleteSessionHistoryRoute = GatewayRouteFactory.proxy(
  'DELETE',
  '/sessions/:sessionId/history',
  GatewayTarget.AUTH,
  '/api/auth/sessions/:sessionId/history',
  GatewayAuthMode.JWT,
);

/**
 * Log out the currently authenticated session.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - The Gateway extracts userId and sid from the verified token.
 * - The Auth service revokes the current session.
 * - No client-supplied userId or sessionId is trusted.
 */
export const authLogoutRoute = GatewayRouteFactory.proxy(
  'POST',
  '/logout',
  GatewayTarget.AUTH,
  '/api/auth/logout',
  GatewayAuthMode.JWT,
);

/**
 * Change the password of the currently authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No explicit permission is required because users
 *   can only change their own password.
 * - The Gateway extracts the user identity from the
 *   verified User JWT.
 * - The Auth service derives the user identity from
 *   the trusted Internal JWT.
 * - All existing session families are revoked after
 *   a successful password change.
 */
export const authChangePasswordRoute = GatewayRouteFactory.proxy(
  'PATCH',
  '/change-password',
  GatewayTarget.AUTH,
  '/api/auth/change-password',
  GatewayAuthMode.JWT,
);

/**
 * Verify a user's email address.
 *
 * Security:
 * - Public from the user's perspective.
 * - Requires Gateway-generated Internal JWT.
 * - Does not require a User JWT because verification
 *   happens before authentication.
 */
export const authVerifyEmailRoute = GatewayRouteFactory.proxy(
  'POST',
  '/email-verification/verify',
  GatewayTarget.AUTH,
  '/api/auth/email-verification/verify',
  GatewayAuthMode.PUBLIC,
);

/**
 * Resend the email verification link.
 *
 * Security:
 * - Public from the user's perspective.
 * - Requires Gateway-generated Internal JWT.
 * - Does not require a User JWT.
 * - The Auth service applies account-level rate limiting.
 */
export const authResendVerificationEmailRoute = GatewayRouteFactory.proxy(
  'POST',
  '/email-verification/resend',
  GatewayTarget.AUTH,
  '/api/auth/email-verification/resend',
  GatewayAuthMode.PUBLIC,
);
