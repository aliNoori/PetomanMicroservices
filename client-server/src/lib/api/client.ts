import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import type { ApiResponse } from "./api-response.types";
import { tokenStorage } from "@/lib/storage";
import type { RefreshTokenResponse } from "@/features/auth/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// A separate instance prevents refresh requests from entering
// the normal authentication interceptors.
export const refreshAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Prevents concurrent requests from triggering
 * multiple refresh operations.
 */
let refreshPromise: Promise<string | null> | null = null;

let sessionExpirationRedirecting = false;

/**
 * Refresh the current access token.
 *
 * The backend rotates refresh tokens.
 * Both returned tokens must be stored.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
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

    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

/**
 * Reuse an ongoing refresh operation instead of
 * creating multiple concurrent refresh requests.
 */
function getRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Attach the current access token to authenticated requests.
 */
axiosInstance.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken && !config.skipAuthRefresh) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/**
 * Handle expired access tokens.
 *
 * 401 -> Refresh -> Retry original request
 *
 * If refresh fails, clear the session and redirect.
 */
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do not refresh requests explicitly excluded from this flow.
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Do not attempt refresh without an existing access token.
    if (!tokenStorage.getAccessToken()) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops.
    if (originalRequest._retry) {
      tokenStorage.clear();
      redirectToLoginAfterSessionExpiration();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await getRefreshPromise();

    if (!newAccessToken) {
      tokenStorage.clear();
      redirectToLoginAfterSessionExpiration();

      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    return axiosInstance.request(originalRequest);
  },
);

export const apiClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);

    return response.data.data;
  },

  async getResponse<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);

    return response.data;
  },

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await axiosInstance.post<ApiResponse<T>>(
      url,
      data,
      config,
    );

    return response.data.data;
  },

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);

    return response.data.data;
  },

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await axiosInstance.patch<ApiResponse<T>>(
      url,
      data,
      config,
    );

    return response.data.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config);

    return response.data.data;
  },

  instance: axiosInstance,
};

/**
 * Redirect to login after the current session expires.
 */
function redirectToLoginAfterSessionExpiration(): void {
  if (sessionExpirationRedirecting) {
    return;
  }

  if (window.location.pathname === "/login") {
    return;
  }

  sessionExpirationRedirecting = true;

  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  const params = new URLSearchParams({
    reason: "session-expired",
    redirect: currentPath,
  });

  window.location.replace(`/login?${params.toString()}`);
}
