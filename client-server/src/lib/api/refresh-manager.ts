
import axios from "axios";

import type { ApiResponse } from "./api-response.types";
import { tokenStorage } from "@/lib/storage";
import type { RefreshTokenResponse } from "@/features/auth/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/";

/**
 * Isolated Axios instance for refresh requests.
 * Refresh requests must never enter the regular API interceptors.
 */
export const refreshAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const TERMINAL_REFRESH_ERROR_CODES = new Set([
  "AUTH_UNAUTHORIZED",
  "AUTH_USER_INACTIVE",
]);

let refreshPromise: Promise<RefreshTokenResponse | null> | null = null;

function isTerminalRefreshError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status !== 401) {
    return false;
  }

  const responseData = error.response.data as
    | { error?: { code?: unknown } }
    | undefined;

  const errorCode = responseData?.error?.code;

  return (
    typeof errorCode === "string" &&
    TERMINAL_REFRESH_ERROR_CODES.has(errorCode)
  );
}

async function performRefresh(): Promise<RefreshTokenResponse | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    tokenStorage.clear();
    return null;
  }

  try {
    const response = await refreshAxiosInstance.post<
      ApiResponse<RefreshTokenResponse>
    >("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const data = response.data.data;

    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);

    return data;
  } catch (error: unknown) {
    if (isTerminalRefreshError(error)) {
      tokenStorage.clear();
      return null;
    }

    // Preserve the existing session when the failure is transient.
    throw error;
  }
}

/**
 * Shares one refresh operation across all consumers.
 *
 * Returns null when no refresh token exists or the refresh session
 * has been rejected by the authentication service.
 *
 * Transient failures are propagated without clearing stored tokens.
 */
export function refreshSession(): Promise<RefreshTokenResponse | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
