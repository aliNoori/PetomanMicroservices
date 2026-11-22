import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen } from "@testing-library/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { PermissionGuard } from "./PermissionGuard";

import { usePermissions } from "../hooks";

vi.mock("../hooks", () => ({
  usePermissions: vi.fn(),
}));

function renderGuard(
  requiredPermissions: string[] = [],
  permissions: string[] = [],
  mode: "all" | "any" = "all",
) {
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
    <MemoryRouter initialEntries={["/workspace/tenant-1/products"]}>
      <Routes>
        <Route
          path="/workspace/:tenantId/products"
          element={
            <PermissionGuard
              requiredPermissions={requiredPermissions}
              mode={mode}
            >
              <div>Products Page</div>
            </PermissionGuard>
          }
        />

        <Route
          path="/403"
          element={<div>Forbidden Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PermissionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when no permissions are required", () => {
    renderGuard([], []);

    expect(screen.getByText("Products Page")).toBeInTheDocument();
  });

  it("renders children when all required permissions are available", () => {
    renderGuard(
      ["product.read", "product.update"],
      ["product.read", "product.update"],
    );

    expect(screen.getByText("Products Page")).toBeInTheDocument();
  });

  it("redirects when at least one required permission is missing in all mode", () => {
    renderGuard(
      ["product.read", "product.delete"],
      ["product.read"],
    );

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });

  it("renders children when at least one permission is available in any mode", () => {
    renderGuard(
      ["product.delete", "product.read"],
      ["product.read"],
      "any",
    );

    expect(screen.getByText("Products Page")).toBeInTheDocument();
  });

  it("redirects when none of the required permissions are available in any mode", () => {
    renderGuard(
      ["product.delete", "product.update"],
      ["product.read"],
      "any",
    );

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });
});