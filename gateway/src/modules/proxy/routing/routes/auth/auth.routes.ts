import {
  authRegisterRoute,
  authLoginRoute,
  authProfileRoute,
  authUsersRoute,
  authRefreshRoute,
  authRevokeSessionRoute,
  authSessionsRoute,
  authDeleteSessionHistoryRoute,
  authLogoutRoute,
  authChangePasswordRoute,
  authVerifyEmailRoute,
  authResendVerificationEmailRoute,
  authPendingTenantsRoute,
  authUpdateProfileAvatarRoute,
} from './users.route';

import{
  redisConnectionTestRoute
} from './health.route';

import {
  authCreateTenantsRoute,
  authGetTenantsRoute,
  authUpdateTenantsRoute,
  authTenantSelectRoute,
  authTenantMembershipRoute,
  authGetTenantMembershipRoute,
  authTenantApproveRoute,
  authTenantRejectRoute,
  authTenantMembershipApproveRoute,
  authTenantMembershipRejectRoute,
} from './tenants.route';

import { storageDownloadRoute } from '../storage/storage.route';

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

  redisConnectionTestRoute,
  // ============================================================
  // User Authentication & Profile
  // ============================================================

  authRegisterRoute,
  authLoginRoute,
  authLogoutRoute,
  authProfileRoute,
  authUpdateProfileAvatarRoute,
  authUsersRoute,
  authRefreshRoute,
  authSessionsRoute,
  authRevokeSessionRoute,
  authDeleteSessionHistoryRoute,
  authChangePasswordRoute,
  authVerifyEmailRoute,
  authResendVerificationEmailRoute,
  authPendingTenantsRoute,

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
  authTenantRejectRoute,

    // ============================================================
  // Storage
  // ============================================================

  storageDownloadRoute,
];