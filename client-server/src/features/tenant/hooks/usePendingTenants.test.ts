import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tenantService } from "../services";

import { usePendingTenants } from "./usePendingTenants";

import type { PendingTenant } from "../types";

vi.mock("../services", () => ({
  tenantService: {
    getPendingTenants: vi.fn(),
    approveTenant: vi.fn(),
    rejectTenant: vi.fn(),
  },
}));

const pendingTenant: PendingTenant = {
  id: "tenant-1",
  name: "Ali Market",
  slug: "ali-market",
  type: "markets",
  ownerId: "user-1",
  status: "PENDING",
  createdAt: "2026-11-10T10:00:00.000Z",
};

describe("usePendingTenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tenantService.getPendingTenants).mockResolvedValue({
      items: [pendingTenant],
      total: 1,
    });
  });

  it("loads pending tenants on mount", async () => {
    const { result } = renderHook(() => usePendingTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tenantService.getPendingTenants).toHaveBeenCalledTimes(1);
    expect(result.current.tenants).toEqual([pendingTenant]);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("approves a tenant and refreshes the list", async () => {
    vi.mocked(tenantService.approveTenant).mockResolvedValue({} as never);

    const { result } = renderHook(() => usePendingTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approve("tenant-1");
    });

    expect(tenantService.approveTenant).toHaveBeenCalledWith("tenant-1");
    expect(tenantService.getPendingTenants).toHaveBeenCalledTimes(2);
  });

  it("rejects a tenant and refreshes the list", async () => {
    vi.mocked(tenantService.rejectTenant).mockResolvedValue({} as never);

    const { result } = renderHook(() => usePendingTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reject("tenant-1", {
        reason: "Invalid tenant information",
      });
    });

    expect(tenantService.rejectTenant).toHaveBeenCalledWith("tenant-1", {
      reason: "Invalid tenant information",
    });

    expect(tenantService.getPendingTenants).toHaveBeenCalledTimes(2);
  });

  it("exposes an error when loading fails", async () => {
    vi.mocked(tenantService.getPendingTenants).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => usePendingTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load pending tenants.");
    expect(result.current.tenants).toEqual([]);
  });
});