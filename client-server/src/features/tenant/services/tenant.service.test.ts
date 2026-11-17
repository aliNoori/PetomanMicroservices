import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";

import { tenantService } from "./tenant.service";

import type {
  CreateTenantRequest,
  CreateTenantResponse,
  TenantMembershipsResponse,
} from "../types/tenant.types";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn(),
    getResponse: vi.fn(),
  },
}));

describe("TenantService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTenant", () => {
    const payload: CreateTenantRequest = {
      name: "Happy Market",
      slug: "happy-market",
      type: "markets",
    };

    const response: CreateTenantResponse = {
      tenant: {
        id: "tenant-123",
        name: "Happy Market",
        slug: "happy-market",
        type: "markets",
        ownerId: "user-123",
        status: "PENDING",
      },
      defaultRoles: {
        tenantAdmin: {
          id: "role-admin",
          slug: "tenant-admin",
        },
        staff: {
          id: "role-staff",
          slug: "staff",
        },
      },
      permissions: {
        tenantAdmin: ["tenant.read", "tenant.update"],
        staff: ["tenant.read"],
      },
    };

    it("creates a tenant successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue(response);

      const result = await tenantService.createTenant(payload);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/tenants",
        payload,
      );

      expect(result).toEqual(response);
      expect(result.tenant.status).toBe("PENDING");
    });

    it("propagates API errors", async () => {
      const error = new Error("Tenant slug already exists.");

      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(
        tenantService.createTenant(payload),
      ).rejects.toThrow("Tenant slug already exists.");
    });
  });

  describe("getTenantMemberships", () => {
    const tenantId = "tenant-123";

    const memberships: TenantMembershipsResponse = {
      tenant: {
        id: tenantId,
        name: "Happy Market",
        slug: "happy-market",
        type: "markets",
        status: "ACTIVE",
      },
      memberships: [
        {
          membershipId: "membership-123",
          tenantId,
          userId: "user-123",
          status: "ACTIVE",
          createdAt: "2026-11-17T10:00:00.000Z",
          user: {
            id: "user-123",
            email: "member@example.com",
            firstName: "John",
            lastName: "Doe",
            avatarKey: null,
            isActive: true,
          },
          roles: [
            {
              roleId: "role-admin",
              name: "Tenant Admin",
              slug: "tenant-admin",
            },
          ],
        },
      ],
    };

    it("gets tenant memberships and unwraps the nested response", async () => {
      vi.mocked(apiClient.getResponse).mockResolvedValue({
        success: true,
        data: {
          success: true,
          data: memberships,
          meta: {
            requestId: "request-123",
            timestamp: "2026-11-17T10:00:00.000Z",
          },
        },
        meta: {
          requestId: "gateway-request-123",
          timestamp: "2026-11-17T10:00:01.000Z",
        },
      });

      const result = await tenantService.getTenantMemberships(tenantId);

      expect(apiClient.getResponse).toHaveBeenCalledWith(
        `/auth/tenants/${tenantId}/memberships`,
      );

      expect(result).toEqual(memberships);
      expect(result.tenant.id).toBe(tenantId);
      expect(result.memberships).toHaveLength(1);
      expect(result.memberships[0].roles[0].slug).toBe("tenant-admin");
    });

    it("propagates API errors", async () => {
      const error = new Error("Failed to load tenant memberships.");

      vi.mocked(apiClient.getResponse).mockRejectedValue(error);

      await expect(
        tenantService.getTenantMemberships(tenantId),
      ).rejects.toThrow("Failed to load tenant memberships.");
    });
  });
});
