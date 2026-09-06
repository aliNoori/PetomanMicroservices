import {
  authRegisterRoute,
  authLoginRoute,
  authProfileRoute,
  authUsersRoute,
} from './users.route';

import {
  authCreateTenantsRoute,
  authGetTenantsRoute,
  authUpdateTenantsRoute,
  authTenantSelectRoute,
  authTenantMembershipRoute,
  authGetTenantMembershipRoute,
  authTenantApproveRoute,
  authTenantMembershipApproveRoute,
  authTenantMembershipRejectRoute,
} from './tenants.route';

/**
 * All Gateway routes exposed by the Auth service.
 *
 * Routes are grouped by domain:
 * - User authentication and profile
 * - Tenant lifecycle and membership management
 *
 * Authentication and authorization requirements are defined
 * at the individual route level.
 */
export const authRoutes = [
  // ============================================================
  // User Authentication & Profile
  // ============================================================

  authRegisterRoute,
  authLoginRoute,
  authProfileRoute,
  authUsersRoute,

  // ============================================================
  // Tenant Management
  // ============================================================

  authCreateTenantsRoute,
  authGetTenantsRoute,
  authUpdateTenantsRoute,
  authTenantSelectRoute,

  // ============================================================
  // Tenant Membership
  // ============================================================

  authTenantMembershipRoute,
  authGetTenantMembershipRoute,
  authTenantMembershipApproveRoute,
  authTenantMembershipRejectRoute,

  // ============================================================
  // Tenant Approval
  // ============================================================

  authTenantApproveRoute,
];