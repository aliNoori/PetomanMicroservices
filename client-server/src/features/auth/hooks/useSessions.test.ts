import {
  act,
  renderHook,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  authService,
} from "@/features/auth";

import type {
  AuthSession,
} from "@/features/auth";

import {
  useSessions,
} from "./useSessions";

import {
  createAuthSession,
} from "@/features/auth/test-utils/session.fixture";

describe("useSessions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads authenticated sessions on mount", async () => {
    const sessions: AuthSession[] = [
      createAuthSession({
        id: "session-1",
        current: true,
      }),
      createAuthSession({
        id: "session-2",
        current: false,
      }),
    ];

    const getSessionsSpy = vi
      .spyOn(authService, "getSessions")
      .mockResolvedValue(sessions);

    const { result } = renderHook(() => useSessions());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getSessionsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.sessions).toEqual(sessions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets an error when loading sessions fails", async () => {
    const getSessionsSpy = vi
      .spyOn(authService, "getSessions")
      .mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() => useSessions());

    await act(async () => {
      await Promise.resolve();
    });

    expect(getSessionsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      "Unable to load your active sessions.",
    );
  });

  it("revokes a session and refreshes the session list", async () => {
    const initialSessions: AuthSession[] = [
      createAuthSession({
        id: "session-1",
        current: true,
      }),
      createAuthSession({
        id: "session-2",
        current: false,
      }),
    ];

    const refreshedSessions: AuthSession[] = [
      initialSessions[0],
    ];

    const getSessionsSpy = vi
      .spyOn(authService, "getSessions")
      .mockResolvedValueOnce(initialSessions)
      .mockResolvedValueOnce(refreshedSessions);

    const revokeSessionSpy = vi
      .spyOn(authService, "revokeSession")
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useSessions());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.sessions).toEqual(initialSessions);

    await act(async () => {
      await result.current.revoke("session-2");
    });

    expect(revokeSessionSpy).toHaveBeenCalledTimes(1);
    expect(revokeSessionSpy).toHaveBeenCalledWith("session-2");

    expect(getSessionsSpy).toHaveBeenCalledTimes(2);
    expect(result.current.sessions).toEqual(refreshedSessions);

    expect(result.current.revokingSessionId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets an error when revoking a session fails", async () => {
    const sessions: AuthSession[] = [
      createAuthSession({
        id: "session-1",
        current: true,
      }),
      createAuthSession({
        id: "session-2",
        current: false,
      }),
    ];

    vi
      .spyOn(authService, "getSessions")
      .mockResolvedValue(sessions);

    const revokeSessionSpy = vi
      .spyOn(authService, "revokeSession")
      .mockRejectedValue(new Error("Revoke failed"));

    const { result } = renderHook(() => useSessions());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.revoke("session-2");
    });

    expect(revokeSessionSpy).toHaveBeenCalledWith("session-2");

    expect(result.current.error).toBe(
      "Unable to revoke this session.",
    );

    expect(result.current.revokingSessionId).toBeNull();
  });

  it("prevents a second revoke while another revoke is in progress", async () => {
    const sessions: AuthSession[] = [
      createAuthSession({
        id: "session-1",
        current: true,
      }),
      createAuthSession({
        id: "session-2",
        current: false,
      }),
      createAuthSession({
        id: "session-3",
        current: false,
      }),
    ];

    vi
      .spyOn(authService, "getSessions")
      .mockResolvedValue(sessions);

    let resolveRevoke: (() => void) | undefined;

    const revokePromise = new Promise<void>((resolve) => {
      resolveRevoke = resolve;
    });

    const revokeSessionSpy = vi
      .spyOn(authService, "revokeSession")
      .mockReturnValue(revokePromise);

    const { result } = renderHook(() => useSessions());

    await act(async () => {
      await Promise.resolve();
    });

    let firstRevoke!: Promise<void>;

    await act(async () => {
      firstRevoke = result.current.revoke("session-2");
      await Promise.resolve();
    });

    expect(result.current.revokingSessionId).toBe("session-2");

    await act(async () => {
      await result.current.revoke("session-3");
    });

    expect(revokeSessionSpy).toHaveBeenCalledTimes(1);
    expect(revokeSessionSpy).toHaveBeenCalledWith("session-2");

    await act(async () => {
      resolveRevoke?.();
      await firstRevoke;
    });

    expect(result.current.revokingSessionId).toBeNull();
  });
});