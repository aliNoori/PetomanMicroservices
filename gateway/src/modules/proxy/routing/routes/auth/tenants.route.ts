import { PERMISSION_SLUGS } from '../../../../../common/constants/permissions.constants';

import { GatewayAuthMode, GatewayTarget } from '../../gateway-route.types';

import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

/**
 * Create a new tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No tenant permission is required because tenant creation
 *   happens before a tenant context is established.
 * - The Auth service derives the owner identity from the
 *   authenticated Internal JWT.
 * - The newly created tenant starts in PENDING status.
 */
export const authCreateTenantsRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants',
  GatewayTarget.AUTH,
  '/api/tenants',
  GatewayAuthMode.JWT,
);

/**
 * Retrieve tenant information.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_READ permission.
 * - Tenant scope and active membership are validated by
 *   the Auth service.
 */
export const authGetTenantsRoute = GatewayRouteFactory.proxy(
  'GET',
  '/tenants/:tenantId',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_READ],
);

/**
 * Update tenant information.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_UPDATE permission.
 * - Tenant scope and active membership are validated by
 *   the Auth service before the update is applied.
 */
export const authUpdateTenantsRoute = GatewayRouteFactory.proxy(
  'PATCH',
  '/tenants/:tenantId',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_UPDATE],
);

/**
 * Select the active tenant context for the authenticated user.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No tenant permission is required because this endpoint
 *   establishes the tenant context used by subsequent requests.
 * - The Auth service validates the user's active membership
 *   before issuing a tenant-scoped User JWT.
 */
export const authTenantSelectRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant/select',
  GatewayTarget.AUTH,
  '/api/auth/tenant/select',
  GatewayAuthMode.JWT,
);

/**
 * Request membership in a tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - No tenant permission is required because membership
 *   requests can be initiated by authenticated users who
 *   are not yet members of the target tenant.
 * - The Auth service owns membership validation and creation.
 */
export const authTenantMembershipRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants/:tenantId/memberships',
  GatewayTarget.AUTH,
  '/api/auth/tenants/:tenantId/memberships',
  GatewayAuthMode.JWT,
);

/**
 * Retrieve tenant memberships.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_MEMBERSHIP_READ permission.
 * - Tenant scope and active membership are validated by
 *   the Auth service for tenant-scoped users.
 * - GLOBAL scope may access memberships across tenants.
 */
export const authGetTenantMembershipRoute = GatewayRouteFactory.proxy(
  'GET',
  '/tenants/:tenantId/memberships',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId/memberships',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_MEMBERSHIP_READ],
);

/**
 * Approve a pending tenant.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_APPROVE permission.
 * - Tenant approval is restricted to authorized administrative
 *   users and is enforced by the Auth service.
 */
export const authTenantApproveRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants/:tenantId/approve',
  GatewayTarget.AUTH,
  '/api/auth/tenants/:tenantId/approve',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_APPROVE],
);

export const authTenantRejectRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants/:tenantId/reject',
  GatewayTarget.AUTH,
  '/api/auth/tenants/:tenantId/reject',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_APPROVE],
);

/**
 * Approve a pending tenant membership.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_MEMBERSHIP_APPROVE permission.
 * - The Auth service validates the requester tenant scope
 *   and the target membership before approval.
 */
export const authTenantMembershipApproveRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant-memberships/:membershipId/approve',
  GatewayTarget.AUTH,
  '/api/auth/tenant-memberships/:membershipId/approve',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_MEMBERSHIP_APPROVE],
);

/**
 * Reject a pending tenant membership.
 *
 * Security:
 * - Requires an authenticated User JWT.
 * - Requires the TENANT_MEMBERSHIP_REJECT permission.
 * - The Auth service validates the requester tenant scope
 *   and the target membership before rejection.
 */
export const authTenantMembershipRejectRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant-memberships/:membershipId/reject',
  GatewayTarget.AUTH,
  '/api/auth/tenant-memberships/:membershipId/reject',
  GatewayAuthMode.JWT,
  [PERMISSION_SLUGS.TENANT_MEMBERSHIP_REJECT],
);
