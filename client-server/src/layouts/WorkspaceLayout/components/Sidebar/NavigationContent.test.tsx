import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen } from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import { NavigationContent } from "./NavigationContent";

import { usePermissions } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  usePermissions: vi.fn(),
}));

function renderNavigation(permissions: string[]) {
  vi.mocked(usePermissions).mockReturnValue({
    permissions,
    hasPermission: (permission: string) =>
      permissions.includes(permission),
    hasAllPermissions: (required: readonly string[]) =>
      required.every((permission) => permissions.includes(permission)),
    hasAnyPermission: (required: readonly string[]) =>
      required.some((permission) => permissions.includes(permission)),
  });

  return render(
    <MemoryRouter initialEntries={["/workspace/tenant-1/dashboard"]}>
      <Routes>
        <Route
          path="/workspace/:tenantId/dashboard"
          element={<NavigationContent />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NavigationContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard without requiring a permission", () => {
    renderNavigation([]);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders only navigation items with granted permissions", () => {
    renderNavigation(["product.read", "tenant.membership.read"]);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Members" })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Orders" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Store Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Roles & Permissions" })).not.toBeInTheDocument();
  });

  it("renders all navigation items when all permissions are granted", () => {
    renderNavigation([
      "product.read",
      "order.read",
      "tenant.update",
      "tenant.membership.read",
      "tenant.role.read",
    ]);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Store Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roles & Permissions" })).toBeInTheDocument();
  });

  it("renders no navigation when tenant ID is missing", () => {
    vi.mocked(usePermissions).mockReturnValue({
      permissions: [],
      hasPermission: () => false,
      hasAllPermissions: () => false,
      hasAnyPermission: () => false,
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <NavigationContent />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("navigation", { name: "Workspace navigation" }),
    ).not.toBeInTheDocument();
  });
});