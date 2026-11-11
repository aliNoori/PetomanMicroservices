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
}

export interface CreatedTenant {
  id: string;
  name: string;
  slug: string;
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

export interface PendingTenant {
  id: string;
  name: string;
  slug: string;
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
    ownerId: string;
    status: "ACTIVE";
    reviewedAt: string;
    reviewedBy: string;
    rejectionReason: null;
  };

  ownerMembership: {
    membershipId: string;
    tenantId: string;
    userId: string;
    status: string;
  };

  ownerRole: {
    roleId: string;
    role: string;
  };

  defaultRoles: TenantDefaultRole[];

  permissions: string[];
}
