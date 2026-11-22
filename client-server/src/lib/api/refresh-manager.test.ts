
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import axios from "axios";

import {
  refreshSession,
  refreshAxiosInstance,
} from "./refresh-manager";

import { tokenStorage } from "@/lib/storage";

describe("refreshSession", () => {
  let originalAdapter: typeof refreshAxiosInstance.defaults.adapter;

  beforeEach(() => {
    originalAdapter = refreshAxiosInstance.defaults.adapter;

    localStorage.clear();

    tokenStorage.setAccessToken("old-access-token");
    tokenStorage.setRefreshToken("valid-refresh-token");
  });

  afterEach(() => {
    refreshAxiosInstance.defaults.adapter = originalAdapter;
    localStorage.clear();
  });

  it("stores new tokens after a successful refresh", async () => {
    refreshAxiosInstance.defaults.adapter = async (config) => ({
      data: {
        success: true,
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          expiresAt: new Date().toISOString(),
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    const result = await refreshSession();

    expect(result?.accessToken).toBe("new-access-token");
    expect(result?.refreshToken).toBe("new-refresh-token");

    expect(tokenStorage.getAccessToken()).toBe("new-access-token");
    expect(tokenStorage.getRefreshToken()).toBe("new-refresh-token");
  });

  it("shares one refresh request across concurrent callers", async () => {
    let refreshCalls = 0;

    refreshAxiosInstance.defaults.adapter = async (config) => {
      refreshCalls += 1;

      await new Promise((resolve) => setTimeout(resolve, 20));

      return {
        data: {
          success: true,
          data: {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            expiresAt: new Date().toISOString(),
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const results = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);

    expect(refreshCalls).toBe(1);

    expect(results).toHaveLength(3);
    expect(results[0]?.accessToken).toBe("new-access-token");
    expect(results[1]?.accessToken).toBe("new-access-token");
    expect(results[2]?.accessToken).toBe("new-access-token");
  });

  it("clears the session when the refresh token is rejected", async () => {
    refreshAxiosInstance.defaults.adapter = async (config) => {
      throw new axios.AxiosError(
        "Refresh token expired",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: {
            success: false,
            error: {
              code: "AUTH_UNAUTHORIZED",
              message: "Refresh token expired",
            },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("preserves the session when a refresh request fails temporarily", async () => {
    refreshAxiosInstance.defaults.adapter = async (config) => {
      throw new axios.AxiosError(
        "Service unavailable",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        {
          data: {
            success: false,
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Service unavailable",
            },
          },
          status: 503,
          statusText: "Service Unavailable",
          headers: {},
          config,
        },
      );
    };

    await expect(refreshSession()).rejects.toThrow();

    expect(tokenStorage.getAccessToken()).toBe("old-access-token");
    expect(tokenStorage.getRefreshToken()).toBe("valid-refresh-token");
  });

  it("clears the session when no refresh token exists", async () => {
    tokenStorage.clear();

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
