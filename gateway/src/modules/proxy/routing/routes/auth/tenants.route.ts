import { GatewayAuthMode, GatewayTarget } from '../../gateway-route.types';
import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

export const authCreateTenantsRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants',
  GatewayTarget.AUTH,
  '/api/tenants',
  GatewayAuthMode.JWT,
);

export const authGetTenantsRoute = GatewayRouteFactory.proxy(
  'GET',
  '/tenants/:tenantId',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId',
  GatewayAuthMode.JWT,
);

export const authUpdateTenantsRoute = GatewayRouteFactory.proxy(
  'PATCH',
  '/tenants/:tenantId',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId',
  GatewayAuthMode.JWT,
);

export const authTenantSelectRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant/select',
  GatewayTarget.AUTH,
  '/api/auth/tenant/select',
  GatewayAuthMode.JWT,
);

export const authTenantMembershipRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants/:tenantId/memberships',
  GatewayTarget.AUTH,
  '/api/auth/tenants/:tenantId/memberships',
  GatewayAuthMode.JWT,
);

export const authGetTenantMembershipRoute = GatewayRouteFactory.proxy(
  'GET',
  '/tenants/:tenantId/memberships',
  GatewayTarget.AUTH,
  '/api/tenants/:tenantId/memberships',
  GatewayAuthMode.JWT,
);

export const authTenantApproveRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenants/:tenantId/approve',
  GatewayTarget.AUTH,
  '/api/auth/tenants/:tenantId/approve',
  GatewayAuthMode.JWT,
);

export const authTenantMembershipApproveRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant-memberships/:membershipId/approve',
  GatewayTarget.AUTH,
  '/api/auth/tenant-memberships/:membershipId/approve',
  GatewayAuthMode.JWT,
);

export const authTenantMembershipRejectRoute = GatewayRouteFactory.proxy(
  'POST',
  '/tenant-memberships/:membershipId/reject',
  GatewayTarget.AUTH,
  '/api/auth/tenant-memberships/:membershipId/reject',
  GatewayAuthMode.JWT,
);
