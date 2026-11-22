import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { SystemRoleGuard } from "./SystemRoleGuard";

import { useAuth } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/common", () => ({
  Loading: () => <div>Loading...</div>,
}));

function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {JSON.stringify({
        pathname: location.pathname,
        state: location.state,
      })}
    </div>
  );
}

function renderGuard(
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

  return render(
    <MemoryRouter
      initialEntries={["/admin/tenants/pending"]}
    >
      <Routes>
        <Route
          path="/admin"
          element={
            <SystemRoleGuard requiredRole="SUPER_ADMIN" />
          }
        >
          <Route
            path="tenants/pending"
            element={<div>Pending Tenants Page</div>}
          />
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

      <LocationDisplay />
    </MemoryRouter>,
  );
}

function getCurrentLocation() {
  return JSON.parse(
    screen.getByTestId("location").textContent ?? "{}",
  );
}

describe("SystemRoleGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows users with the required system role", () => {
    renderGuard();

    expect(
      screen.getByText("Pending Tenants Page"),
    ).toBeInTheDocument();

    expect(screen.queryByText("Forbidden Page")).not.toBeInTheDocument();
  });

  it("redirects users without the required system role to 403", () => {
    renderGuard({
      user: {
        systemRoles: ["USER"],
      },
    });

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();

    expect(getCurrentLocation()).toMatchObject({
      pathname: "/403",
    });
  });

  it("redirects users without an active session to login", () => {
    renderGuard({
      sessionActive: false,
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();

    expect(getCurrentLocation()).toMatchObject({
      pathname: "/login",
      state: {
        from: {
          pathname: "/admin/tenants/pending",
        },
      },
    });
  });

  it("displays loading while restoring the session", () => {
    renderGuard({
      loading: true,
      sessionActive: false,
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Tenants Page")).not.toBeInTheDocument();
  });
});