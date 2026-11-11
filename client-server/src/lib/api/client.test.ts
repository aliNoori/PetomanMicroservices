
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import axios from "axios";

import {
  apiClient,
  refreshAxiosInstance,
} from "./client";

import { tokenStorage } from "@/lib/storage";

describe("apiClient silent refresh", () => {
  let originalAdapter: typeof apiClient.instance.defaults.adapter;
  let originalRefreshAdapter: typeof refreshAxiosInstance.defaults.adapter;

  beforeEach(() => {
    vi.restoreAllMocks();

    localStorage.clear();

    originalAdapter = apiClient.instance.defaults.adapter;
    originalRefreshAdapter = refreshAxiosInstance.defaults.adapter;

    tokenStorage.setAccessToken("expired-access-token");
    tokenStorage.setRefreshToken("valid-refresh-token");
  });

  afterEach(() => {
    apiClient.instance.defaults.adapter = originalAdapter;
    refreshAxiosInstance.defaults.adapter = originalRefreshAdapter;

    localStorage.clear();

    vi.restoreAllMocks();
  });

  it("performs only one refresh for concurrent 401 responses", async () => {
    let protectedCalls = 0;
    let retryCalls = 0;
    let refreshCalls = 0;

    apiClient.instance.defaults.adapter = async (config) => {
      const authorization = config.headers?.Authorization;

      protectedCalls += 1;

      if (authorization === "Bearer expired-access-token") {
        throw new axios.AxiosError(
          "Access token expired",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          {
            data: {
              success: false,
              error: {
                code: "AUTH_UNAUTHORIZED",
                message: "Access token expired",
              },
            },
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
          },
        );
      }

      if (authorization === "Bearer new-access-token") {
        retryCalls += 1;

        return {
          data: {
            success: true,
            data: {
              message: "success",
            },
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      throw new Error(`Unexpected authorization: ${authorization}`);
    };

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
      apiClient.get("/protected/profile"),
      apiClient.get("/protected/orders"),
      apiClient.get("/protected/settings"),
    ]);

    expect(results).toEqual([
      { message: "success" },
      { message: "success" },
      { message: "success" },
    ]);

    expect(protectedCalls).toBe(6);
    expect(refreshCalls).toBe(1);
    expect(retryCalls).toBe(3);

    expect(tokenStorage.getAccessToken()).toBe("new-access-token");
    expect(tokenStorage.getRefreshToken()).toBe("new-refresh-token");
  });

  it("clears the session when refresh fails", async () => {
    apiClient.instance.defaults.adapter = async (config) => {
      throw new axios.AxiosError(
        "Access token expired",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: {
            success: false,
            error: {
              code: "AUTH_UNAUTHORIZED",
              message: "Access token expired",
            },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

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

    await expect(
      apiClient.get("/protected/profile"),
    ).rejects.toThrow();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("does not retry a request more than once", async () => {
    let protectedCalls = 0;

    apiClient.instance.defaults.adapter = async (config) => {
      protectedCalls += 1;

      throw new axios.AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: {
            success: false,
            error: {
              code: "AUTH_UNAUTHORIZED",
              message: "Unauthorized",
            },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

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

    await expect(
      apiClient.get("/protected/profile"),
    ).rejects.toThrow();

    expect(protectedCalls).toBe(2);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
