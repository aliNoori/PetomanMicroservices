export type TenantType = "markets" | "vets" | "pharmacies";

export interface TenantAddress {
  city: string;
  area?: string;
  street?: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  type: TenantType;
  slug: string;
  rating?: number;
  distance?: number;
  isOnline?: boolean;
  logoUrl?: string;
  address: TenantAddress;
}

export interface TenantSectionProps {
  title: string;

  tenants: TenantSummary[];
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  type: TenantType;
}

export interface CreatedTenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  ownerId: string;
  status: "PENDING";
}

export interface TenantDefaultRole {
  id: string;
  slug: string;
}

export interface CreateTenantResponse {
  tenant: CreatedTenant;

  defaultRoles: {
    tenantAdmin: TenantDefaultRole;
    staff: TenantDefaultRole;
  };

  permissions: {
    tenantAdmin: string[];
    staff: string[];
  };
}

export type TenantStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type TenantMembershipStatus = "PENDING" | "ACTIVE" | "REJECTED";

export interface PendingTenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  ownerId: string;
  status: "PENDING";
  createdAt: string;
}

export interface PendingTenantsResponse {
  items: PendingTenant[];
  total: number;
}

export interface TenantReviewResult {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: "ACTIVE" | "REJECTED";
  reviewedAt: string;
  reviewedBy: string;
  rejectionReason: string | null;
}

export interface RejectTenantRequest {
  reason: string;
}

export interface ApproveTenantResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    type: TenantType;
    ownerId: string;
    status: TenantStatus;
    reviewedAt: string;
    reviewedBy: string;
    rejectionReason: null;
  };

  ownerMembership: {
    membershipId: string;
    tenantId: string;
    userId: string;
    status: TenantMembershipStatus;
  };

  ownerRole: {
    roleId: string;
    role: string;
  };

  defaultRoles: TenantDefaultRole[];

  permissions: string[];
}

export interface TenantMembershipTenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
}

export interface TenantMembershipUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarKey: string | null;
  isActive: boolean;
}

export interface TenantMembershipRole {
  roleId: string;
  name: string;
  slug: string;
}

export interface ApproveTenantMembershipResponse {
  membershipId: string;
  tenantId: string;
  userId: string;
  status: "ACTIVE";
  role: TenantDefaultRole;
}

export interface RejectTenantMembershipResponse {
  membershipId: string;
  tenantId: string;
  userId: string;
  status: "REJECTED";
}

export interface TenantMembership {
  membershipId: string;
  tenantId: string;
  userId: string;
  status: TenantMembershipStatus;
  createdAt: string;
  user: TenantMembershipUser | null;
  roles: TenantMembershipRole[];
}

export interface TenantMembershipsResponse {
  tenant: TenantMembershipTenant;
  memberships: TenantMembership[];
}
