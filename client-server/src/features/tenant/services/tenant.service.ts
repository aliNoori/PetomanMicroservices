import { apiClient } from "@/lib/api/client";

import type {
  CreateTenantRequest,
  CreateTenantResponse,
  PendingTenantsResponse,
  ApproveTenantResponse,
  TenantReviewResult,
  RejectTenantRequest,
  ApproveTenantMembershipResponse,
  RejectTenantMembershipResponse,
} from "../types/tenant.types";

import type { ApiResponse } from "@/lib/api/api-response.types";

import type { TenantMembershipsResponse } from "../types/tenant.types";

class TenantService {
  async createTenant(
    payload: CreateTenantRequest,
  ): Promise<CreateTenantResponse> {
    return apiClient.post<CreateTenantResponse>("/auth/tenants", payload);
  }

  /**
   * Get all tenants waiting for SUPER_ADMIN review.
   */
  async getPendingTenants(): Promise<PendingTenantsResponse> {
    return apiClient.get<PendingTenantsResponse>("/auth/tenants/pending");
  }

  /**
   * Approve a pending tenant.
   */
  async approveTenant(tenantId: string): Promise<ApproveTenantResponse> {
    return apiClient.post<ApproveTenantResponse>(
      `/auth/tenants/${tenantId}/approve`,
    );
  }

  /**
   * Reject a pending tenant with a reason.
   */
  async rejectTenant(
    tenantId: string,
    payload: RejectTenantRequest,
  ): Promise<TenantReviewResult> {
    return apiClient.post<TenantReviewResult>(
      `/auth/tenants/${tenantId}/reject`,
      payload,
    );
  }

  /**
   * Get all memberships and their tenant-specific roles.
   */
  async getTenantMemberships(
    tenantId: string,
  ): Promise<TenantMembershipsResponse> {
    const response = await apiClient.getResponse<
      ApiResponse<TenantMembershipsResponse>
    >(`/auth/tenants/${tenantId}/memberships`);

    return response.data.data;
  }

  /**
   * Approve a pending tenant membership request.
   */
  async approveTenantMembership(
    membershipId: string,
  ): Promise<ApproveTenantMembershipResponse> {
    return apiClient.post<ApproveTenantMembershipResponse>(
      `/auth/tenant-memberships/${membershipId}/approve`,
    );
  }

  /**
   * Reject a pending tenant membership request.
   */
  async rejectTenantMembership(
    membershipId: string,
  ): Promise<RejectTenantMembershipResponse> {
    return apiClient.post<RejectTenantMembershipResponse>(
      `/auth/tenant-memberships/${membershipId}/reject`,
    );
  }
}

export const tenantService = new TenantService();
