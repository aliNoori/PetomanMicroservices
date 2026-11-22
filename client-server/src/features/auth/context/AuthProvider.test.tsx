import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";

import { useContext } from "react";

import { fireEvent } from "@testing-library/react";

import { AuthProvider } from "./AuthProvider";
import { AuthContext } from "./AuthContext";

import { authService } from "../services";
import { tokenStorage } from "@/lib/storage";
import { refreshSession } from "@/lib/api/refresh-manager";

vi.mock("../services", () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
    selectTenant: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/lib/api/refresh-manager", () => ({
  refreshSession: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    removeAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    removeRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
}));

function AuthStateProbe() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext is not available.");
  }

  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="session-active">{String(auth.sessionActive)}</span>
      <span data-testid="authenticated">{String(auth.authenticated)}</span>
      <span data-testid="user-email">{auth.user?.email ?? ""}</span>
      <span data-testid="tenants-count">{auth.tenants.length}</span>
      <span data-testid="roles">{JSON.stringify(auth.roles)}</span>
      <span data-testid="permissions"> {JSON.stringify(auth.permissions)}</span>
      <button
        type="button"
        onClick={() => {
          void auth
            .login({
              email: "user@example.com",
              password: "Password123!",
            })
            .catch(() => undefined);
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          void auth.selectTenant("tenant-123").catch(() => undefined);
        }}
      >
        Select Tenant
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(refreshSession).mockResolvedValue(null);
  });

  it("clears the authentication state when no refresh token exists", async () => {
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("false");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(authService.getMe).not.toHaveBeenCalled();
  });

  it("restores an active session without a selected tenant", async () => {
    const accessToken = `header.${btoa(
      JSON.stringify({
        tenantId: null,
        roles: [],
        permissions: [],
      }),
    )}.signature`;

    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [],
      tenantRoles: [],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(
      "old-refresh-token",
    );

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken,
      refreshToken: "new-refresh-token",
      expiresAt: "2026-11-20T10:00:00.000Z",
    });

    vi.mocked(authService.getMe).mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("true");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(authService.getMe).toHaveBeenCalledTimes(1);
  });

  it("preserves the active session when the selected tenant is no longer active", async () => {
    const accessToken = `header.${btoa(
      JSON.stringify({
        tenantId: "tenant-123",
        roles: ["TENANT_ADMIN"],
        permissions: ["products.read"],
      }),
    )}.signature`;

    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [
        {
          membershipId: "membership-123",
          tenantId: "tenant-123",
          status: "ACTIVE" as const,
          tenant: {
            id: "tenant-123",
            name: "Petoman",
            slug: "petoman",
            type: "markets" as const,
            status: "PENDING" as const,
            ownerId: "user-123",
          },
        },
      ],
      tenantRoles: [],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(
      "old-refresh-token",
    );

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken,
      refreshToken: "new-refresh-token",
      expiresAt: "2026-11-20T10:00:00.000Z",
    });

    vi.mocked(authService.getMe).mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("true");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "user@example.com",
    );
    expect(screen.getByTestId("tenants-count")).toHaveTextContent("0");

    expect(tokenStorage.clear).not.toHaveBeenCalled();
    expect(authService.getMe).toHaveBeenCalledTimes(1);
  });

  it("restores an authenticated session with an active tenant", async () => {
    const accessToken = `header.${btoa(
      JSON.stringify({
        tenantId: "tenant-123",
        roles: ["TENANT_ADMIN"],
        permissions: ["products.read", "products.create"],
      }),
    )}.signature`;

    const tenant = {
      id: "tenant-123",
      name: "Petoman",
      slug: "petoman",
      type: "markets" as const,
    } as const;

    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [
        {
          membershipId: "membership-123",
          tenantId: "tenant-123",
          status: "ACTIVE" as const,
          tenant: {
            ...tenant,
            status: "ACTIVE" as const,
            ownerId: "user-123",
          },
        },
      ],
      tenantRoles: [
        {
          tenantId: "tenant-123",
          role: "TENANT_ADMIN",
        },
      ],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(
      "old-refresh-token",
    );

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken,
      refreshToken: "new-refresh-token",
      expiresAt: "2026-11-20T10:00:00.000Z",
    });

    vi.mocked(authService.getMe).mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("true");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("roles")).toHaveTextContent('["TENANT_ADMIN"]');

    expect(screen.getByTestId("permissions")).toHaveTextContent(
      '["products.read","products.create"]',
    );
  });

  it("logs in successfully and creates an active session without a selected tenant", async () => {
    const tenants = [
      {
        id: "tenant-123",
        name: "Petoman",
        slug: "petoman",
        type: "markets" as const,
      },
    ];

    // Prevent session restoration from interfering with this test.
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);

    vi.mocked(authService.login).mockResolvedValue({
      accessToken: "login-access-token",
      refreshToken: "login-refresh-token",
      tenants,
    });

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("session-active")).toHaveTextContent("true");
      expect(screen.getByTestId("tenants-count")).toHaveTextContent("1");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-email")).toHaveTextContent("");

    expect(authService.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password123!",
    });

    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith(
      "login-access-token",
    );

    expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith(
      "login-refresh-token",
    );

    expect(tokenStorage.clear).not.toHaveBeenCalled();
  });

  it("clears the authentication state when login fails", async () => {
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);

    vi.mocked(authService.login).mockRejectedValue(
      new Error("Invalid credentials"),
    );

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("session-active")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-email")).toHaveTextContent("");
    expect(screen.getByTestId("tenants-count")).toHaveTextContent("0");

    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);

    expect(tokenStorage.setAccessToken).not.toHaveBeenCalled();
    expect(tokenStorage.setRefreshToken).not.toHaveBeenCalled();
  });

  it("selects a tenant successfully and activates tenant-scoped authentication", async () => {
    const tenant = {
      id: "tenant-123",
      name: "Petoman",
      slug: "petoman",
      type: "markets" as const,
    };

    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [
        {
          membershipId: "membership-123",
          tenantId: "tenant-123",
          status: "ACTIVE" as const,
          tenant: {
            ...tenant,
            status: "ACTIVE" as const,
            ownerId: "user-123",
          },
        },
      ],
      tenantRoles: [
        {
          tenantId: "tenant-123",
          role: "TENANT_ADMIN",
        },
      ],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    const accessToken = `header.${btoa(
      JSON.stringify({
        tenantId: null,
        roles: [],
        permissions: [],
      }),
    )}.signature`;

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken,
      refreshToken: "login-refresh-token",
      expiresAt: "2026-11-20T10:00:00.000Z",
    });

    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(
      "login-refresh-token",
    );

    vi.mocked(authService.selectTenant).mockResolvedValue({
      accessToken: "tenant-access-token",
      tenant,
      roles: ["TENANT_ADMIN"],
      permissions: ["products.read", "products.create"],
    });

    vi.mocked(authService.getMe).mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Select Tenant" }));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("true");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "user@example.com",
    );

    expect(screen.getByTestId("roles")).toHaveTextContent('["TENANT_ADMIN"]');

    expect(screen.getByTestId("permissions")).toHaveTextContent(
      '["products.read","products.create"]',
    );

    expect(authService.selectTenant).toHaveBeenCalledWith({
      tenantId: "tenant-123",
      refresh_token: "login-refresh-token",
    });

    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith(
      "tenant-access-token",
    );

    expect(authService.getMe).toHaveBeenCalledTimes(2);
  });

  it("preserves the active session when tenant selection fails", async () => {
    const accessToken = `header.${btoa(
      JSON.stringify({
        tenantId: null,
        roles: [],
        permissions: [],
      }),
    )}.signature`;

    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [],
      tenantRoles: [],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken,
      refreshToken: "login-refresh-token",
      expiresAt: "2026-11-20T10:00:00.000Z",
    });

    vi.mocked(authService.getMe).mockResolvedValue(user);

    vi.mocked(authService.selectTenant).mockReset();

    vi.mocked(authService.selectTenant).mockRejectedValue(
      new Error("Tenant selection failed"),
    );

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Select Tenant" }));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session-active")).toHaveTextContent("true");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "user@example.com",
    );

    expect(screen.getByTestId("tenants-count")).toHaveTextContent("0");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    expect(tokenStorage.clear).not.toHaveBeenCalled();

    expect(authService.selectTenant).toHaveBeenCalledWith({
      tenantId: "tenant-123",
      refresh_token: "login-refresh-token",
    });

    expect(authService.getMe).toHaveBeenCalledTimes(1);
  });
});
