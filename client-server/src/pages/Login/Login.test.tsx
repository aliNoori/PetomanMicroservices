
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { MemoryRouter, useLocation } from "react-router-dom";

import { LoginPage } from "./Login";

import { useAuth } from "@/features/auth";

import type { LoginResponse } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();

  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="location-state">
        {JSON.stringify(location.state)}
      </div>
    </>
  );
}

function renderLogin(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LoginPage />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

function createLoginResponse(): LoginResponse {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tenants: [],
  };
}

function createAuthContext(
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) {
  return {
    user: null,
    tenants: [],
    selectedTenant: null,
    roles: [],
    permissions: [],
    sessionActive: false,
    loading: false,
    authenticated: false,

    login: vi.fn().mockResolvedValue(createLoginResponse()),
    selectTenant: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),

    ...overrides,
  };
}

async function submitLogin() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/email/i), "user@example.com");
  await user.type(screen.getByLabelText(/password/i), "password");

  await user.click(
    screen.getByRole("button", {
      name: /sign in/i,
    }),
  );
}

describe("LoginPage", () => {
  it("shows session expiration message", () => {
    vi.mocked(useAuth).mockReturnValue(createAuthContext());

    renderLogin("/login?reason=session-expired&redirect=%2Fprofile");

    expect(
      screen.getByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
  });

  it("navigates to the profile after a successful login without a return path", async () => {
    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin("/login");

    await submitLogin();

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/profile",
    );
  });

  it("navigates directly to an account destination after login", async () => {
    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin("/login?reason=session-expired&redirect=%2Fprofile%2Fsettings");

    await submitLogin();

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/profile/settings",
    );
  });

  it("redirects to tenant selection for a workspace destination and preserves it", async () => {
    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin(
      "/login?reason=session-expired&redirect=%2Fworkspace%2Ftenant-123%2Forders%3Fpage%3D2",
    );

    await submitLogin();

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/auth/select-tenant",
    );

    expect(screen.getByTestId("location-state")).toHaveTextContent(
      JSON.stringify({
        returnTo: {
          pathname: "/workspace/tenant-123/orders",
          search: "?page=2",
          hash: "",
        },
      }),
    );
  });

  it("redirects a super admin to platform administration", async () => {
    const login = vi.fn().mockResolvedValue(createLoginResponse());

    const refreshUser = vi.fn().mockResolvedValue({
      systemRoles: ["SUPER_ADMIN"],
    });

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
        refreshUser,
      }),
    );

    renderLogin("/login");

    await submitLogin();

    expect(login).toHaveBeenCalled();
    expect(refreshUser).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/admin/tenants/pending",
    );
  });

  it("falls back to the profile for an external redirect", async () => {
    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin(
      "/login?reason=session-expired&redirect=https%3A%2F%2Fevil.example",
    );

    await submitLogin();

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/profile",
    );
  });
});
