import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen } from "@testing-library/react";

import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { WorkspaceTenantGuard } from "./WorkspaceTenantGuard";

import { useAuth } from "@/features/auth";

import type { TenantOption } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

const selectedTenant: TenantOption = {
  id: "tenant-1",
  name: "Main Market",
  slug: "main-market",
  type: "markets",
};

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

function renderGuard(
  tenantId: string,
  selectedTenantOverride: TenantOption | null = selectedTenant,
  authenticated = true,
) {
  vi.mocked(useAuth).mockReturnValue({
    selectedTenant: selectedTenantOverride,
    authenticated,
  } as ReturnType<typeof useAuth>);

  return render(
    <MemoryRouter initialEntries={[`/workspace/${tenantId}/dashboard`]}>
      <Routes>
        <Route
          path="/workspace/:tenantId/dashboard"
          element={<WorkspaceTenantGuard />}
        >
          <Route path="" element={<div>Workspace Dashboard</div>} />
        </Route>

        <Route
          path="/auth/select-tenant"
          element={<div>Select Tenant Page</div>}
        />
      </Routes>

      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("WorkspaceTenantGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects when no tenant is selected", () => {
    renderGuard("tenant-1", null);

    expect(screen.getByText("Select Tenant Page")).toBeInTheDocument();
  });

  it("renders the outlet when the selected tenant matches the route", () => {
    renderGuard("tenant-1");

    expect(screen.getByText("Workspace Dashboard")).toBeInTheDocument();
  });

  it("redirects to the selected tenant when route tenant differs", () => {
    renderGuard("tenant-2");

    expect(screen.getByText("Workspace Dashboard")).toBeInTheDocument();

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/workspace/tenant-1/dashboard",
    );
  });

  it("redirects when workspace context is not authenticated", () => {
    renderGuard("tenant-1", selectedTenant, false);

    expect(screen.getByText("Select Tenant Page")).toBeInTheDocument();
  });
});
