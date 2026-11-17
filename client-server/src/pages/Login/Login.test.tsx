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

  return <div data-testid="location">{location.pathname}</div>;
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

describe("LoginPage session expiration", () => {
  it("shows session expiration message", () => {
    vi.mocked(useAuth).mockReturnValue(createAuthContext());

    renderLogin("/login?reason=session-expired&redirect=%2Fprofile");

    expect(
      screen.getByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
  });

  it("navigates to tenant selection after successful login", async () => {
    const user = userEvent.setup();

    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin("/login?reason=session-expired&redirect=%2Fprofile");

    await user.type(screen.getByLabelText(/email/i), "user@example.com");

    await user.type(screen.getByLabelText(/password/i), "password");

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/auth/select-tenant",
    );
  });

  it("falls back to home for an external redirect", async () => {
    const user = userEvent.setup();

    const login = vi.fn().mockResolvedValue(createLoginResponse());

    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        login,
      }),
    );

    renderLogin(
      "/login?reason=session-expired&redirect=https%3A%2F%2Fevil.example",
    );

    await user.type(screen.getByLabelText(/email/i), "user@example.com");

    await user.type(screen.getByLabelText(/password/i), "password");

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    expect(login).toHaveBeenCalled();

    expect(await screen.findByTestId("location")).toHaveTextContent("/");
  });
});
