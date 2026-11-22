import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { TenantSelectionPage } from "./TenantSelectionPage";
import { useAuth } from "@/features/auth";

import type { TenantOption } from "@/features/auth/types";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const tenants: TenantOption[] = [
  {
    id: "tenant-123",
    name: "Happy Market",
    slug: "happy-market",
    type: "markets",
  },
  {
    id: "tenant-456",
    name: "Pet Clinic",
    slug: "pet-clinic",
    type: "vets",
  },
];

const mockSelectTenant = vi.fn().mockResolvedValue(undefined);

function createAuthContext(
  overrides: Record<string, unknown> = {},
) {
  return {
    user: null,
    tenants,
    selectedTenant: null,
    sessionActive: true,
    loading: false,
    authenticated: false,
    roles: [],
    permissions: [],
    login: vi.fn(),
    selectTenant: mockSelectTenant,
    logout: vi.fn(),
    refreshUser: vi.fn(),
    changePassword: vi.fn(),
    ...overrides,
  };
}

function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="current-location">
      {JSON.stringify({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: location.state,
      })}
    </div>
  );
}

function renderPage(
  authContext: ReturnType<typeof createAuthContext>,
  state?: unknown,
) {
  mockUseAuth.mockReturnValue(
    authContext as ReturnType<typeof useAuth>,
  );

  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/auth/select-tenant",
          state,
        },
      ]}
    >
      <Routes>
        <Route
          path="/auth/select-tenant"
          element={<TenantSelectionPage />}
        />

        <Route
          path="*"
          element={<LocationDisplay />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function getCurrentLocation() {
  return JSON.parse(
    screen.getByTestId("current-location").textContent ?? "{}",
  );
}

describe("TenantSelectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectTenant.mockResolvedValue(undefined);
  });

  it("renders active tenant options", () => {
    renderPage(createAuthContext());

    expect(
      screen.getByRole("heading", {
        name: /select a workspace/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /happy market/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /pet clinic/i }),
    ).toBeInTheDocument();
  });

  it("disables Continue until a tenant is selected", () => {
    renderPage(createAuthContext());

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeDisabled();
  });

  it("selects a tenant and preserves its matching deep return path", async () => {
    const user = userEvent.setup();

    renderPage(createAuthContext(), {
      returnTo: {
        pathname: "/workspace/tenant-123/orders",
        search: "?page=2",
        hash: "#recent",
      },
    });

    await user.click(
      screen.getByRole("button", { name: /happy market/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    await waitFor(() => {
      expect(mockSelectTenant).toHaveBeenCalledWith("tenant-123");
    });

    await waitFor(() => {
      expect(getCurrentLocation()).toMatchObject({
        pathname: "/workspace/tenant-123/orders",
        search: "?page=2",
        hash: "#recent",
      });
    });
  });

  it("redirects to the selected tenant dashboard when return path belongs to another tenant", async () => {
    const user = userEvent.setup();

    renderPage(createAuthContext(), {
      returnTo: {
        pathname: "/workspace/tenant-999/orders",
      },
    });

    await user.click(
      screen.getByRole("button", { name: /pet clinic/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    await waitFor(() => {
      expect(mockSelectTenant).toHaveBeenCalledWith("tenant-456");
    });

    await waitFor(() => {
      expect(getCurrentLocation().pathname).toBe(
        "/workspace/tenant-456/dashboard",
      );
    });
  });

  it("redirects an already authenticated user to the matching tenant destination", async () => {
    renderPage(
      createAuthContext({
        authenticated: true,
        selectedTenant: tenants[0],
      }),
      {
        returnTo: {
          pathname: "/workspace/tenant-123/orders",
          search: "?page=3",
        },
      },
    );

    await waitFor(() => {
      expect(getCurrentLocation()).toMatchObject({
        pathname: "/workspace/tenant-123/orders",
        search: "?page=3",
      });
    });

    expect(mockSelectTenant).not.toHaveBeenCalled();
  });

  it("redirects an already authenticated user to their selected tenant dashboard when return path belongs to another tenant", async () => {
    renderPage(
      createAuthContext({
        authenticated: true,
        selectedTenant: tenants[0],
      }),
      {
        returnTo: {
          pathname: "/workspace/tenant-456/orders",
        },
      },
    );

    await waitFor(() => {
      expect(getCurrentLocation().pathname).toBe(
        "/workspace/tenant-123/dashboard",
      );
    });

    expect(mockSelectTenant).not.toHaveBeenCalled();
  });

  it("redirects users without an active session to login and preserves the return path", async () => {
    renderPage(
      createAuthContext({
        sessionActive: false,
      }),
      {
        returnTo: {
          pathname: "/workspace/tenant-123/orders",
          search: "?page=2",
        },
      },
    );

    await waitFor(() => {
      expect(getCurrentLocation()).toMatchObject({
        pathname: "/login",
        state: {
          from: {
            pathname: "/workspace/tenant-123/orders",
            search: "?page=2",
            hash: "",
          },
        },
      });
    });
  });

  it("displays an error when tenant selection fails", async () => {
    const user = userEvent.setup();

    mockSelectTenant.mockRejectedValue(
      new Error("Tenant selection failed"),
    );

    renderPage(createAuthContext());

    await user.click(
      screen.getByRole("button", { name: /happy market/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByText(
        /unable to select this tenant\. please try again/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /select a workspace/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows a loading state while restoring the session", () => {
    renderPage(
      createAuthContext({
        loading: true,
      }),
    );

    expect(
      screen.getByText(/restoring your session/i),
    ).toBeInTheDocument();
  });
});
