import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import type { ApiResponse } from "./api-response.types";
import { tokenStorage } from "@/lib/storage";

import { refreshSession } from "./refresh-manager";

export { refreshAxiosInstance } from "./refresh-manager";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionExpirationRedirecting = false;

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

    const refreshResult = await refreshSession();

    if (!refreshResult) {
      redirectToLoginAfterSessionExpiration();

      return Promise.reject(error);
    }

    const newAccessToken = refreshResult.accessToken;

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
