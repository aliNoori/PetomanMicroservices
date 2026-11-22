import { useCallback, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services";

import { tokenStorage } from "@/lib/storage";

import { AuthContext } from "./AuthContext";

import { initialAuthState } from "../store/auth.store";

import { refreshSession } from "@/lib/api/refresh-manager";

import type {
  AuthUser,
  AuthTenantMembership,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  TenantOption,
} from "../types";

interface Props {
  children: ReactNode;
}

interface JwtPayload {
  tenantId?: string | null;
  roles?: unknown;
  permissions?: unknown;
}

interface AuthContextFromToken {
  tenantId: string | null;
  roles: string[];
  permissions: string[];
}

/**
 * Decode the access token and extract the active authentication context.
 *
 * This is used only for UI context restoration.
 * Authorization decisions must always be enforced by the backend.
 */
function getAuthContextFromAccessToken(token: string): AuthContextFromToken {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid access token format.");
  }

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const payload = JSON.parse(window.atob(paddedBase64)) as JwtPayload;

  return {
    tenantId:
      typeof payload.tenantId === "string" && payload.tenantId.length > 0
        ? payload.tenantId
        : null,

    roles: Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === "string")
      : [],

    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.filter(
          (permission): permission is string => typeof permission === "string",
        )
      : [],
  };
}

/**
 * Extract active tenants from the user's profile.
 */
function getActiveTenants(user: AuthUser): TenantOption[] {
  return user.tenantMemberships
    .filter((membership: AuthTenantMembership) => {
      return (
        membership.status === "ACTIVE" && membership.tenant.status === "ACTIVE"
      );
    })
    .map((membership) => ({
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      type: membership.tenant.type,
    }));
}

let restoreSessionPromise: Promise<AuthUser | null> | null = null;

export function AuthProvider({ children }: Props) {
  const [state, setState] = useState(initialAuthState);

  /**
   * Restore the authentication session.
   *
   * The refresh token is the source of truth for session restoration.
   * The backend preserves the selected tenant context during rotation.
   */
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (restoreSessionPromise) {
      return restoreSessionPromise;
    }

    const operation = (async (): Promise<AuthUser | null> => {
      setState((previous) => ({
        ...previous,
        loading: true,
      }));

      let response: Awaited<ReturnType<typeof refreshSession>>;

      // Refresh Manager handles token rotation and token storage.
      try {
        response = await refreshSession();
      } catch (error) {
        console.error("[AuthProvider] Session refresh failed:", error);

        // Preserve the existing tokens when the refresh failure is temporary.
        setState((previous) => ({
          ...previous,
          loading: false,
        }));

        throw error;
      }

      // A null result means the refresh session is no longer valid.
      if (!response) {
        setState({
          ...initialAuthState,
          loading: false,
        });

        return null;
      }

      try {
        const authContext = getAuthContextFromAccessToken(response.accessToken);

        // Load the user's profile using the fresh access token.
        const user = await authService.getMe();

        const tenants = getActiveTenants(user);

        // Preserve the login session when no tenant has been selected.
        if (!authContext.tenantId) {
          setState({
            user,
            tenants,
            selectedTenant: null,
            roles: [],
            permissions: [],
            loading: false,
            authenticated: false,
            sessionActive: true,
          });

          return user;
        }

        // Find the selected tenant in the user's active memberships.
        const selectedTenant =
          tenants.find((tenant) => tenant.id === authContext.tenantId) ?? null;

        if (!selectedTenant) {
          setState({
            user,
            tenants,
            selectedTenant: null,
            roles: [],
            permissions: [],
            loading: false,
            authenticated: false,
            sessionActive: true,
          });

          return user;
        }

        setState({
          user,
          tenants,
          selectedTenant,
          roles: authContext.roles,
          permissions: authContext.permissions,
          loading: false,
          authenticated: true,
          sessionActive: true,
        });

        return user;
      } catch (error) {
        console.error("[AuthProvider] Session restoration failed:", error);

        // Do not destroy a potentially valid session because profile loading failed.
        setState((previous) => ({
          ...previous,
          loading: false,
        }));

        throw error;
      }
    })();

    restoreSessionPromise = operation;

    try {
      return await operation;
    } finally {
      if (restoreSessionPromise === operation) {
        restoreSessionPromise = null;
      }
    }
  }, []);

  /**
   * Authenticate the user with email and password.
   *
   * Tenant selection is intentionally handled separately.
   */
  const login = useCallback(
    async (payload: LoginRequest): Promise<LoginResponse> => {
      setState((previous) => ({
        ...previous,
        loading: true,
      }));

      try {
        const response = await authService.login(payload);

        if (!response.accessToken || !response.refreshToken) {
          throw new Error("Login response is missing authentication tokens.");
        }

        tokenStorage.setAccessToken(response.accessToken);
        tokenStorage.setRefreshToken(response.refreshToken);

        setState({
          user: null,
          tenants: response.tenants,
          selectedTenant: null,
          roles: [],
          permissions: [],
          loading: false,
          authenticated: false,
          sessionActive: true,
        });

        return response;
      } catch (error) {
        tokenStorage.clear();

        setState({
          ...initialAuthState,
          loading: false,
        });

        throw error;
      }
    },
    [],
  );

  /**
   * Select a tenant and establish the tenant-scoped session.
   */
  const selectTenant = useCallback(async (tenantId: string): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No active login session was found.");
    }

    setState((previous) => ({
      ...previous,
      loading: true,
    }));

    try {
      const response = await authService.selectTenant({
        tenantId,
        refresh_token: refreshToken,
      });

      if (!response.accessToken) {
        throw new Error("Tenant selection response is missing accessToken.");
      }

      if (
        !Array.isArray(response.roles) ||
        !Array.isArray(response.permissions)
      ) {
        throw new Error(
          "Tenant selection response contains invalid access context.",
        );
      }

      // The backend keeps the existing refresh token unchanged.
      tokenStorage.setAccessToken(response.accessToken);

      // Retrieve the profile with the new tenant-scoped access token.
      const user = await authService.getMe();

      const tenants = getActiveTenants(user);

      const selectedTenant =
        tenants.find((tenant) => tenant.id === response.tenant.id) ?? null;

      if (!selectedTenant) {
        throw new Error(
          "The selected tenant is not available in the user profile.",
        );
      }

      setState({
        user,
        tenants,
        selectedTenant,
        roles: response.roles,
        permissions: response.permissions,
        loading: false,
        authenticated: true,
        sessionActive: true,
      });
    } catch (error) {
      // Keep the login session so the user can retry or restore it.
      setState((previous) => ({
        ...previous,
        loading: false,
        authenticated: false,
        roles: [],
        permissions: [],
        selectedTenant: null,
      }));

      throw error;
    }
  }, []);

  /**
   * Sign out and clear the local authentication state.
   */
  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      if (refreshToken) {
        await authService.logout({
          refresh_token: refreshToken,
        });
      }
    } finally {
      tokenStorage.clear();

      setState({
        ...initialAuthState,
        loading: false,
      });
    }
  }, []);

  /**
   * Change the current user's password.
   *
   * After a successful password change, all existing
   * sessions are revoked by the backend.
   */
  const changePassword = useCallback(
    async (payload: ChangePasswordRequest): Promise<void> => {
      await authService.changePassword(payload);

      tokenStorage.clear();

      setState({
        ...initialAuthState,
        loading: false,
      });
    },
    [],
  );

  /**
   * Restore the session once when the provider is mounted.
   */
  useEffect(() => {
    void refreshUser().catch(() => undefined);
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        selectTenant,
        logout,
        refreshUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
