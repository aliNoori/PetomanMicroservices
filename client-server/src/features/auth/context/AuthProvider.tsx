import { useCallback, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services";

import { tokenStorage } from "@/lib/storage";

import { AuthContext } from "./AuthContext";

import { initialAuthState } from "../store/auth.store";

import type {
  AuthUser,
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
}

interface TenantMembership {
  status?: string;
  tenantId?: string;
  tenant?: {
    id?: string;
    name?: string;
    slug?: string;
    status?: string;
  };
}

/**
 * Decode the JWT payload.
 *
 * This is used only to determine the current UI context.
 * Authorization decisions must always be enforced by the backend.
 */
function getTenantIdFromAccessToken(token: string): string | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid access token format.");
  }

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const payload = JSON.parse(window.atob(paddedBase64)) as JwtPayload;

  return payload.tenantId ?? null;
}

/**
 * Extract active tenants from the user's profile.
 */
function getActiveTenants(user: AuthUser): TenantOption[] {
  return user.tenantMemberships
    .filter((item): item is TenantMembership => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const membership = item as TenantMembership;

      return (
        membership.status?.toLowerCase() === "active" &&
        membership.tenant?.status?.toLowerCase() === "active" &&
        typeof membership.tenant.id === "string" &&
        typeof membership.tenant.name === "string" &&
        typeof membership.tenant.slug === "string"
      );
    })
    .map((membership) => ({
      id: membership.tenant!.id!,
      name: membership.tenant!.name!,
      slug: membership.tenant!.slug!,
    }));
}

let refreshPromise: Promise<AuthUser | null> | null = null;

export function AuthProvider({ children }: Props) {
  const [state, setState] = useState(initialAuthState);

  /**
   * Restore the authentication session.
   *
   * The refresh token is the source of truth for session restoration.
   * The backend preserves the selected tenant context during rotation.
   */

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    // Reuse the ongoing refresh operation if another caller already started it.
    if (refreshPromise) {
      return refreshPromise;
    }

    const operation = (async (): Promise<AuthUser | null> => {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clear();

        setState({
          ...initialAuthState,
          loading: false,
        });

        return null;
      }

      setState((previous) => ({
        ...previous,
        loading: true,
      }));

      try {
        // Rotate the refresh token and obtain a fresh access token.
        const response = await authService.refresh({
          refresh_token: refreshToken,
        });

        tokenStorage.setAccessToken(response.accessToken);
        tokenStorage.setRefreshToken(response.refreshToken);

        const tenantId = getTenantIdFromAccessToken(response.accessToken);

        // Load the user's profile using the fresh access token.
        const user = await authService.getMe();

        const tenants = getActiveTenants(user);

        // Preserve the session when no tenant has been selected.
        if (!tenantId) {
          setState({
            user,
            tenants,
            selectedTenant: null,
            loading: false,
            authenticated: false,
            sessionActive: true,
          });

          return user;
        }

        // Find the selected tenant in the user's active memberships.
        const selectedTenant =
          tenants.find((tenant) => tenant.id === tenantId) ?? null;

        if (!selectedTenant) {
          tokenStorage.clear();

          setState({
            ...initialAuthState,
            loading: false,
          });

          return null;
        }

        setState({
          user,
          tenants,
          selectedTenant,
          loading: false,
          authenticated: true,
          sessionActive: true,
        });

        return user;
      } catch (error) {
        console.error("[AuthProvider] Session restoration failed:", error);

        tokenStorage.clear();

        setState({
          ...initialAuthState,
          loading: false,
        });

        throw error;
      }
    })();

    refreshPromise = operation;

    try {
      return await operation;
    } finally {
      // Allow a future refresh after the current operation finishes.
      if (refreshPromise === operation) {
        refreshPromise = null;
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
   * Clear the local authentication state and require
   * the user to sign in again.
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
