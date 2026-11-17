import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { MembersPage } from "./Members";
import { useTenantMemberships } from "@/features/tenant";

import type { TenantMembershipsResponse } from "@/features/tenant";

vi.mock("@/features/tenant", () => ({
  useTenantMemberships: vi.fn(),
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
        firstName: "Ali",
        lastName: "Noori",
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

function createHookResult(
  overrides: Partial<ReturnType<typeof useTenantMemberships>> = {},
) {
  return {
    tenant: mockResponse.tenant,
    memberships: mockResponse.memberships,
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderMembers() {
  return render(
    <MemoryRouter initialEntries={["/workspace/tenant-1/members"]}>
      <Routes>
        <Route path="/workspace/:tenantId/members" element={<MembersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("MembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tenant members and their information", () => {
    vi.mocked(useTenantMemberships).mockReturnValue(createHookResult());

    renderMembers();

    expect(
      screen.getByRole("heading", { name: "Members" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Store")).toBeInTheDocument();
    expect(screen.getByText("Ali Noori")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Tenant Admin")).toBeInTheDocument();
    expect(
      screen.getByText(
        new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
        }).format(new Date("2026-11-17T10:00:00.000Z")),
      ),
    ).toBeInTheDocument();
  });

  it("should display membership status labels", () => {
    vi.mocked(useTenantMemberships).mockReturnValue(createHookResult());

    renderMembers();

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should display loading state", () => {
    vi.mocked(useTenantMemberships).mockReturnValue(
      createHookResult({
        loading: true,
        tenant: null,
        memberships: [],
      }),
    );

    renderMembers();

    expect(
      screen.getByText("Loading workspace members..."),
    ).toBeInTheDocument();
  });

  it("should display empty state when there are no members", () => {
    vi.mocked(useTenantMemberships).mockReturnValue(
      createHookResult({
        memberships: [],
      }),
    );

    renderMembers();

    expect(screen.getByText("No members found")).toBeInTheDocument();
  });

  it("should display an error and allow retry", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useTenantMemberships).mockReturnValue(
      createHookResult({
        tenant: null,
        memberships: [],
        error: "Failed to load tenant memberships.",
        refresh,
      }),
    );

    renderMembers();

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("should refresh members when the refresh button is clicked", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useTenantMemberships).mockReturnValue(
      createHookResult({ refresh }),
    );

    renderMembers();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
