import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tenantService } from "../services";

import { useTenantMemberships } from "./useTenantMemberships";

import type { TenantMembershipsResponse } from "../types";

vi.mock("../services", () => ({
  tenantService: {
    getTenantMemberships: vi.fn(),
    approveTenantMembership: vi.fn(),
    rejectTenantMembership: vi.fn(),
  },
}));

const mockResponse: TenantMembershipsResponse = {
  tenant: {
    id: "tenant-1",
    name: "Test Store",
    slug: "test-store",
    type: "markets",
    status: "ACTIVE",
  },
  memberships: [
    {
      membershipId: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      status: "ACTIVE",
      createdAt: "2026-11-17T10:00:00.000Z",
      user: {
        id: "user-1",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        avatarKey: null,
        isActive: true,
      },
      roles: [
        {
          roleId: "role-1",
          name: "Tenant Admin",
          slug: "tenant-admin",
        },
      ],
    },
  ],
};

describe("useTenantMemberships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load tenant memberships on mount", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tenantService.getTenantMemberships).toHaveBeenCalledWith("tenant-1");
    expect(result.current.tenant).toEqual(mockResponse.tenant);
    expect(result.current.memberships).toEqual(mockResponse.memberships);
    expect(result.current.error).toBeNull();
  });

  it("should expose an error when loading memberships fails", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockRejectedValue(
      new Error("Request failed"),
    );

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenant).toBeNull();
    expect(result.current.memberships).toEqual([]);
    expect(result.current.error).toBe("Failed to load tenant memberships.");
  });

  it("should refresh tenant memberships", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(tenantService.getTenantMemberships).toHaveBeenCalledTimes(2);
    expect(result.current.memberships).toEqual(mockResponse.memberships);
  });
  it("should approve a membership and refresh the memberships list", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );
    vi.mocked(tenantService.approveTenantMembership).mockResolvedValue({
      membershipId: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      status: "ACTIVE",
      role: {
        id: "role-1",
        slug: "staff",
      },
    });

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approveMembership("membership-1");
    });

    expect(tenantService.approveTenantMembership).toHaveBeenCalledWith(
      "membership-1",
    );
    expect(tenantService.getTenantMemberships).toHaveBeenCalledTimes(2);
    expect(result.current.actionError).toBeNull();
    expect(result.current.processingMembershipId).toBeNull();
  });

  it("should reject a membership and refresh the memberships list", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );
    vi.mocked(tenantService.rejectTenantMembership).mockResolvedValue({
      membershipId: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      status: "REJECTED",
    });

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.rejectMembership("membership-1");
    });

    expect(tenantService.rejectTenantMembership).toHaveBeenCalledWith(
      "membership-1",
    );
    expect(tenantService.getTenantMemberships).toHaveBeenCalledTimes(2);
    expect(result.current.actionError).toBeNull();
    expect(result.current.processingMembershipId).toBeNull();
  });

  it("should expose an action error when approving a membership fails", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );
    vi.mocked(tenantService.approveTenantMembership).mockRejectedValue(
      new Error("Request failed"),
    );

    const { result } = renderHook(() => useTenantMemberships("tenant-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approveMembership("membership-1");
    });

    expect(result.current.actionError).toBe(
      "Failed to approve membership request.",
    );
    expect(result.current.error).toBeNull();
    expect(result.current.processingMembershipId).toBeNull();
    expect(tenantService.getTenantMemberships).toHaveBeenCalledTimes(1);
  });

  it("should not call the service when tenantId is empty", async () => {
    const { result } = renderHook(() => useTenantMemberships(""));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tenantService.getTenantMemberships).not.toHaveBeenCalled();
    expect(result.current.tenant).toBeNull();
    expect(result.current.memberships).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should reload memberships when tenantId changes", async () => {
    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      mockResponse,
    );

    const { result, rerender } = renderHook(
      ({ tenantId }) => useTenantMemberships(tenantId),
      {
        initialProps: { tenantId: "tenant-1" },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const secondResponse: TenantMembershipsResponse = {
      ...mockResponse,
      tenant: {
        ...mockResponse.tenant,
        id: "tenant-2",
        name: "Second Store",
      },
      memberships: [],
    };

    vi.mocked(tenantService.getTenantMemberships).mockResolvedValue(
      secondResponse,
    );

    rerender({ tenantId: "tenant-2" });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.tenant?.id).toBe("tenant-2");
    });

    expect(tenantService.getTenantMemberships).toHaveBeenNthCalledWith(
      2,
      "tenant-2",
    );
    expect(result.current.memberships).toEqual([]);
  });
});
