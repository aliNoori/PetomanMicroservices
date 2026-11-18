import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { MemoryRouter, useLocation } from "react-router-dom";

import { UserMenu } from "./UserMenu";

import { useAuth } from "@/features/auth";

import type { AuthUser, TenantOption } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/profile/components/UserAvatar/UserAvatar", () => ({
  UserAvatar: ({ fallback }: { fallback: string }) => (
    <span data-testid="user-avatar">{fallback}</span>
  ),
}));

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

const tenants: TenantOption[] = [
  {
    id: "tenant-1",
    name: "Main Market",
    slug: "main-market",
    type: "markets",
  },
  {
    id: "tenant-2",
    name: "Pet Clinic",
    slug: "pet-clinic",
    type: "vets",
  },
];

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
  tenantMemberships: [],
  tenantRoles: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

function createAuthContext(
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) {
  return {
    user: authUser,
    tenants,
    selectedTenant: tenants[0],
    roles: [],
    permissions: [],
    sessionActive: true,
    loading: false,
    authenticated: true,
    selectTenant: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as ReturnType<typeof useAuth>;
}

function renderUserMenu() {
  return render(
    <MemoryRouter initialEntries={["/workspace/tenant-1/dashboard"]}>
      <UserMenu />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("UserMenu tenant switcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(createAuthContext());
  });

  it("renders the user menu trigger", () => {
    renderUserMenu();

    expect(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    ).toBeInTheDocument();
  });

  it("shows the create workspace option when the menu is opened", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        tenants: [],
        selectedTenant: null,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    expect(
      screen.getByRole("menuitem", { name: /create workspace/i }),
    ).toBeInTheDocument();
  });

  it("navigates to create workspace page and closes the menu", async () => {
    const user = userEvent.setup();

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", { name: /create workspace/i }),
    );

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/tenants/create",
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows available tenants when the menu is opened", async () => {
    const user = userEvent.setup();

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    expect(screen.getByText("Your workspaces")).toBeInTheDocument();
    expect(screen.getByText("Main Market")).toBeInTheDocument();
    expect(screen.getByText("Pet Clinic")).toBeInTheDocument();
  });

  it("marks the currently selected tenant", async () => {
    const user = userEvent.setup();

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    const activeTenant = screen.getByRole("menuitem", {
      name: /main market\s*main-market/i,
    });

    expect(activeTenant).toHaveAttribute("aria-current", "page");
  });

  it("shows the tenant option when the user has only one tenant", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        tenants: [tenants[0]],
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    expect(screen.getByText("Your workspaces")).toBeInTheDocument();

    expect(
      screen.getByRole("menuitem", {
        name: /main market\s*main-market/i,
      }),
    ).toBeInTheDocument();
  });

  it("navigates to the current tenant dashboard without switching", async () => {
    const user = userEvent.setup();

    const selectTenant = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        tenants: [tenants[0]],
        selectTenant,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: /main market\s*main-market/i,
      }),
    );

    expect(selectTenant).not.toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspace/tenant-1/dashboard",
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("switches to another tenant and navigates to its dashboard", async () => {
    const user = userEvent.setup();

    const selectTenant = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        selectTenant,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: /pet clinic\s*pet-clinic/i,
      }),
    );

    await waitFor(() => {
      expect(selectTenant).toHaveBeenCalledWith("tenant-2");
    });

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspace/tenant-2/dashboard",
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("navigates to the current tenant without switching it again", async () => {
    const user = userEvent.setup();

    const selectTenant = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        selectTenant,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: /main market\s*main-market/i,
      }),
    );

    expect(selectTenant).not.toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspace/tenant-1/dashboard",
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows an error when tenant switching fails", async () => {
    const user = userEvent.setup();

    const selectTenant = vi.fn().mockRejectedValue(new Error("Switch failed"));

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        selectTenant,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: /pet clinic\s*pet-clinic/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to switch workspace. Please try again.",
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/workspace/tenant-1/dashboard",
    );
  });

  it("keeps tenant options disabled while switching is in progress", async () => {
    const user = userEvent.setup();

    let resolveSwitch!: () => void;

    const selectTenant = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSwitch = resolve;
        }),
    );

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        selectTenant,
      }),
    );

    renderUserMenu();

    await user.click(
      screen.getByRole("button", { name: /user menu for ali noori/i }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: /pet clinic\s*pet-clinic/i,
      }),
    );

    expect(
      screen.getByRole("menuitem", {
        name: /pet clinic\s*pet-clinic/i,
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("menuitem", {
        name: /main market\s*main-market/i,
      }),
    ).toBeDisabled();

    resolveSwitch();

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
