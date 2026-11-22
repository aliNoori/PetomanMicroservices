import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import { SystemRoleGuard } from "@/features/auth/components/SystemRoleGuard";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PendingTenantsPage } from "@/pages/Admin/Tenants/Pending";

import { useAuth } from "@/features/auth";
import { usePendingTenants } from "@/features/tenant";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/tenant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/tenant")>();

  return {
    ...actual,
    usePendingTenants: vi.fn(),
  };
});

vi.mock("@/components", () => ({
  ThemeToggle: () => <button type="button">Theme toggle</button>,
}));

vi.mock("@/layouts/AppLayout/components/Header/UserMenu", () => ({
  UserMenu: () => <div>User menu</div>,
}));

vi.mock("@/components/common", () => ({
  Loading: () => <div>Loading...</div>,
}));

function renderAdminRoutes(
  authOverrides: Record<string, unknown> = {},
) {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      systemRoles: ["SUPER_ADMIN"],
    },
    sessionActive: true,
    loading: false,
    ...authOverrides,
  } as ReturnType<typeof useAuth>);

  vi.mocked(usePendingTenants).mockReturnValue({
    tenants: [],
    total: 0,
    loading: false,
    error: null,
    actionTenantId: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    approve: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
  });

  return render(
    <MemoryRouter initialEntries={["/admin/tenants/pending"]}>
      <Routes>
        <Route
          element={<SystemRoleGuard requiredRole="SUPER_ADMIN" />}
        >
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/tenants/pending"
              element={<PendingTenantsPage />}
            />
          </Route>
        </Route>

        <Route
          path="/login"
          element={<div>Login Page</div>}
        />

        <Route
          path="/403"
          element={<div>Forbidden Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Admin routes integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows SUPER_ADMIN to access the pending tenants page", () => {
    renderAdminRoutes();

    expect(
      screen.getByRole("heading", {
        name: "Platform Administration",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /pending tenant management/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", {
        name: "Admin navigation",
      }),
    ).toBeInTheDocument();
  });

  it("denies access to users without SUPER_ADMIN role", () => {
    renderAdminRoutes({
      user: {
        systemRoles: ["USER"],
      },
    });

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Platform Administration",
      }),
    ).not.toBeInTheDocument();
  });

  it("redirects users without an active session to login", () => {
    renderAdminRoutes({
      sessionActive: false,
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Platform Administration",
      }),
    ).not.toBeInTheDocument();
  });
});