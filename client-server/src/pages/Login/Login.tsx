import { useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth, type LoginRequest } from "@/features/auth";

import { isAxiosError } from "axios";

import type { ApiErrorResponse } from "@/lib/api/api-response.types";

import type {
  AuthNavigationState,
  ReturnToLocation,
} from "@/features/auth/types";

import { LoginForm } from "./components";

const DEFAULT_RETURN_TO: ReturnToLocation = {
  pathname: "/",
};

/**
 * Validate a return path before using it for navigation.
 * Only internal application paths are allowed.
 */
function getSafeReturnTo(
  value?: ReturnToLocation | string | null,
): ReturnToLocation {
  if (!value) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const url = new URL(
      typeof value === "string" ? value : value.pathname,
      window.location.origin,
    );

    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith("/") ||
      url.pathname.startsWith("//")
    ) {
      return DEFAULT_RETURN_TO;
    }

    return {
      pathname: url.pathname,
      search: typeof value === "string" ? url.search : (value.search ?? ""),
      hash: typeof value === "string" ? url.hash : (value.hash ?? ""),
    };
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function LoginPage() {
  const { login, refreshUser, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState<string | null>(null);

  const navigationState = location.state as AuthNavigationState | null;

  const searchParams = new URLSearchParams(location.search);

  const sessionExpired = searchParams.get("reason") === "session-expired";

  const queryRedirect = searchParams.get("redirect");

  const returnTo = getSafeReturnTo(
    sessionExpired && queryRedirect ? queryRedirect : navigationState?.from,
  );

  async function handleLogin(payload: LoginRequest): Promise<void> {
    setError(null);

    try {
      await login(payload);

      const refreshedUser = await refreshUser();

      const isSuperAdmin =
        refreshedUser?.systemRoles?.includes("SUPER_ADMIN") ?? false;

      if (isSuperAdmin) {
        navigate("/admin/tenants/pending", {
          replace: true,
        });

        return;
      }

      navigate("/auth/select-tenant", {
        replace: true,
        state: {
          returnTo,
        } satisfies AuthNavigationState,
      });
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error)) {
        const errorCode = error.response?.data?.error?.code;

        if (errorCode === "EMAIL_NOT_VERIFIED") {
          setError(
            "Your email address has not been verified. Please check your inbox and verify your email before signing in.",
          );
          return;
        }

        if (errorCode === "INVALID_CREDENTIALS") {
          setError("Invalid email or password.");
          return;
        }
      }

      setError("Unable to sign in. Please try again.");
    }
  }

  const displayError =
    error ??
    (sessionExpired ? "Your session has expired. Please sign in again." : null);

  return (
    <LoginForm loading={loading} error={displayError} onSubmit={handleLogin} />
  );
}
