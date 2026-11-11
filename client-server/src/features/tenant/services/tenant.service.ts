import { apiClient } from "@/lib/api/client";

import type {
  CreateTenantRequest,
  CreateTenantResponse,
  PendingTenantsResponse,
  ApproveTenantResponse,
  TenantReviewResult,
  RejectTenantRequest,
} from "../types/tenant.types";

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
}

export const tenantService = new TenantService();
