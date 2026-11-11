import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";

import { tenantService } from "./tenant.service";

import type {
  CreateTenantRequest,
  CreateTenantResponse,
} from "../types/tenant.types";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn(),
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
    };

    const response: CreateTenantResponse = {
      tenant: {
        id: "tenant-123",
        name: "Happy Market",
        slug: "happy-market",
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
});