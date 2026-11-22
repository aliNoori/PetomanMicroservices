import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AuthGuard } from "./AuthGuard";

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
        search: location.search,
        hash: location.hash,
        state: location.state,
      })}
    </div>
  );
}

function renderGuard(
  authOverrides: Record<string, unknown> = {},
) {
  vi.mocked(useAuth).mockReturnValue({
    sessionActive: true,
    loading: false,
    ...authOverrides,
  } as ReturnType<typeof useAuth>);

  return render(
    <MemoryRouter
      initialEntries={[
        "/profile/settings?tab=security#password",
      ]}
    >
      <Routes>
        <Route
          path="/profile/settings"
          element={
            <AuthGuard>
              <div>Protected Account Page</div>
            </AuthGuard>
          }
        />

        <Route
          path="/login"
          element={<div>Login Page</div>}
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

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an active session without a selected tenant", () => {
    renderGuard({
      sessionActive: true,
    });

    expect(
      screen.getByText("Protected Account Page"),
    ).toBeInTheDocument();

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects when the session is inactive", () => {
    renderGuard({
      sessionActive: false,
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();

    expect(getCurrentLocation()).toMatchObject({
      pathname: "/login",
      state: {
        from: {
          pathname: "/profile/settings",
          search: "?tab=security",
          hash: "#password",
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
    expect(screen.queryByText("Protected Account Page")).not.toBeInTheDocument();
  });

  it("does not require workspace authentication for account routes", () => {
    renderGuard({
      sessionActive: true,
      authenticated: false,
      selectedTenant: null,
    });

    expect(
      screen.getByText("Protected Account Page"),
    ).toBeInTheDocument();
  });
});
