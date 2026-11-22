import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "./auth.service";

import { apiClient } from "@/lib/api/client";

describe("AuthService sessions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gets the authenticated user profile and normalizes email verification", async () => {
    const profile = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: "2026-11-18T10:00:00.000Z",
      avatarUrl: null,
      systemRoles: [],
      tenantMemberships: [],
      tenantRoles: [],
      createdAt: "2026-11-18T09:00:00.000Z",
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(profile);

    const result = await authService.getMe();

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith("/auth/profile");

    expect(result.isEmailVerified).toBe(true);
    expect(result).not.toHaveProperty("emailVerified");
    expect(result.id).toBe(profile.id);
    expect(result.tenantMemberships).toEqual([]);
  });

  it("gets authenticated user sessions", async () => {
    const sessions = [
      {
        id: "session-1",
        current: true,
        created_at: "2026-08-14T10:00:00Z",
        expires_at: "2026-08-15T10:00:00Z",
      },
      {
        id: "session-2",
        current: false,
        created_at: "2026-08-13T10:00:00Z",
        expires_at: "2026-08-14T10:00:00Z",
      },
    ];

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(sessions);

    const result = await authService.getSessions();

    expect(getSpy).toHaveBeenCalledTimes(1);

    expect(getSpy).toHaveBeenCalledWith("/auth/sessions");

    expect(result).toEqual(sessions);
  });

  it("revokes a specific session", async () => {
    const deleteSpy = vi
      .spyOn(apiClient, "delete")
      .mockResolvedValue(undefined);

    const sessionID = "session-123";

    await authService.revokeSession(sessionID);

    expect(deleteSpy).toHaveBeenCalledTimes(1);

    expect(deleteSpy).toHaveBeenCalledWith(`/auth/sessions/${sessionID}`);
  });

  describe("AuthService registration", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("registers a new user", async () => {
      const payload = {
        email: "user@example.com",
        password: "password123",
        firstName: "Ali",
        lastName: "Noori",
      };

      const response = {
        id: "user-123",
        email: "user@example.com",
        firstName: "Ali",
        lastName: "Noori",
        isActive: true,
        isEmailVerified: false,
        tenantMemberships: [],
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(response);

      const result = await authService.register(payload);

      expect(postSpy).toHaveBeenCalledTimes(1);

      expect(postSpy).toHaveBeenCalledWith("/auth/register", payload, {
        skipAuthRefresh: true,
      });

      expect(result).toEqual(response);
    });

    it("resends the email verification link", async () => {
      const payload = {
        email: "user@example.com",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(undefined);

      await authService.resendVerificationEmail(payload);

      expect(postSpy).toHaveBeenCalledTimes(1);

      expect(postSpy).toHaveBeenCalledWith(
        "/auth/email-verification/resend",
        payload,
        {
          skipAuthRefresh: true,
        },
      );
    });
  });
});
