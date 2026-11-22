
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { MyWorkspacesPage } from "./MyWorkspacesPage";
import { useAuth } from "@/features/auth";

import type { AuthUser } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

const authUser: AuthUser = {
  id: "user-1",
  email: "ali@example.com",
  firstName: "Ali",
  lastName: "Noori",
  isActive: true,
  isEmailVerified: true,
  emailVerifiedAt: "2026-01-01T00:00:00.000Z",
  avatarUrl: null,
  systemRoles: [],
  tenantRoles: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  tenantMemberships: [],
};

const memberships: AuthUser["tenantMemberships"] = [
  {
    membershipId: "membership-1",
    tenantId: "tenant-1",
    status: "ACTIVE",
    tenant: {
      id: "tenant-1",
      name: "Main Market",
      slug: "main-market",
      type: "markets",
      status: "ACTIVE",
      ownerId: "user-1",
    },
  },
  {
    membershipId: "membership-2",
    tenantId: "tenant-2",
    status: "PENDING",
    tenant: {
      id: "tenant-2",
      name: "Pet Clinic",
      slug: "pet-clinic",
      type: "vets",
      status: "ACTIVE",
      ownerId: "user-2",
    },
  },
  {
    membershipId: "membership-3",
    tenantId: "tenant-3",
    status: "REJECTED",
    tenant: {
      id: "tenant-3",
      name: "City Pharmacy",
      slug: "city-pharmacy",
      type: "pharmacies",
      status: "ACTIVE",
      ownerId: "user-3",
    },
  },
];

function createAuthContext(user: AuthUser | null = authUser) {
  return {
    user,
    loading: false,
    sessionActive: true,
    authenticated: false,
    tenants: [],
    selectedTenant: null,
    roles: [],
    permissions: [],
    login: vi.fn(),
    selectTenant: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    changePassword: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>;
}

function renderPage(user: AuthUser | null = authUser) {
  vi.mocked(useAuth).mockReturnValue(createAuthContext(user));

  return render(
    <MemoryRouter>
      <MyWorkspacesPage />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("MyWorkspacesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading and create workspace link", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: /my workspaces/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /create workspace/i }),
    ).toHaveAttribute("href", "/tenants/create");
  });

  it("shows an empty state when the user has no memberships", () => {
    renderPage({
      ...authUser,
      tenantMemberships: [],
    });

    expect(
      screen.getByRole("heading", { name: /no workspaces yet/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /create your first workspace/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("region", { name: /workspace memberships/i }),
    ).not.toBeInTheDocument();
  });

  it("renders memberships with their separate membership and workspace statuses", () => {
    renderPage({
      ...authUser,
      tenantMemberships: memberships,
    });

    expect(screen.getByText("Main Market")).toBeInTheDocument();
    expect(screen.getByText("Pet Clinic")).toBeInTheDocument();
    expect(screen.getByText("City Pharmacy")).toBeInTheDocument();

    expect(screen.getByText("Active membership")).toBeInTheDocument();
    expect(screen.getByText("Membership pending")).toBeInTheDocument();
    expect(screen.getByText("Membership rejected")).toBeInTheDocument();

    expect(screen.getAllByText("Workspace active")).toHaveLength(3);
  });

  it("allows opening a workspace only when both statuses are active", async () => {
    const user = userEvent.setup();

    renderPage({
      ...authUser,
      tenantMemberships: memberships,
    });

    const activeCard = screen
      .getByText("Main Market")
      .closest("article");

    const pendingCard = screen
      .getByText("Pet Clinic")
      .closest("article");

    const rejectedCard = screen
      .getByText("City Pharmacy")
      .closest("article");

    expect(activeCard).not.toBeNull();
    expect(pendingCard).not.toBeNull();
    expect(rejectedCard).not.toBeNull();

    await user.click(
      within(activeCard!).getByRole("button", {
        name: /open workspace/i,
      }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/workspace/tenant-1/dashboard",
    );

    expect(
      within(pendingCard!).queryByRole("button", {
        name: /open workspace/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      within(rejectedCard!).queryByRole("button", {
        name: /open workspace/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not allow opening a workspace with pending workspace status", () => {
    renderPage({
      ...authUser,
      tenantMemberships: [
        {
          membershipId: "membership-4",
          tenantId: "tenant-4",
          status: "ACTIVE",
          tenant: {
            id: "tenant-4",
            name: "Pending Market",
            slug: "pending-market",
            type: "markets",
            status: "PENDING",
            ownerId: "user-1",
          },
        },
      ],
    });

    expect(screen.getByText("Active membership")).toBeInTheDocument();

    expect(
      screen.getByText("Workspace pending approval"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /open workspace/i }),
    ).not.toBeInTheDocument();
  });

  it("does not allow opening a rejected workspace", () => {
    renderPage({
      ...authUser,
      tenantMemberships: [
        {
          membershipId: "membership-5",
          tenantId: "tenant-5",
          status: "ACTIVE",
          tenant: {
            id: "tenant-5",
            name: "Rejected Market",
            slug: "rejected-market",
            type: "markets",
            status: "REJECTED",
            ownerId: "user-1",
          },
        },
      ],
    });

    expect(screen.getByText("Active membership")).toBeInTheDocument();

    expect(
      screen.getByText("Workspace rejected"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /open workspace/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the user is unavailable", () => {
    const { container } = renderPage(null);

    expect(container.querySelector("main")).not.toBeInTheDocument();
  });
});
