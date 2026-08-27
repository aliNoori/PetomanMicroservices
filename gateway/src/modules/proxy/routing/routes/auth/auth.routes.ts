import { authTenantSelectRoute,
  authTenantMembershipRejectRoute,
  authTenantMembershipRoute,
  authTenantMembershipApproveRoute,
  authGetTenantsRoute,
  authCreateTenantsRoute,
  authUpdateTenantsRoute,
  authTenantApproveRoute,
  authGetTenantMembershipRoute
 } from './tenants.route';
import {
  authUsersRoute,
  authRegisterRoute,
  authLoginRoute,
  authProfileRoute
} from './users.route';

export const authRoutes = [

  //users routes
  authRegisterRoute,
  authLoginRoute,
  authProfileRoute,
  authUsersRoute,

  //tenants routes
  authGetTenantsRoute,
  authCreateTenantsRoute,
  authUpdateTenantsRoute,
  authTenantSelectRoute,
  authTenantMembershipRejectRoute,
  authTenantMembershipRoute,
  authGetTenantMembershipRoute,
  authTenantMembershipApproveRoute,
  authTenantApproveRoute  
];