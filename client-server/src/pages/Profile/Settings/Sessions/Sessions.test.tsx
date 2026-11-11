import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SessionsPage } from "./Sessions";

import { useSessions } from "@/features/auth";

import { createAuthSession } from "@/features/auth/test-utils/session.fixture";

vi.mock("@/features/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/auth")>("@/features/auth");

  return {
    ...actual,
    useSessions: vi.fn(),
  };
});

const mockedUseSessions = vi.mocked(useSessions);

describe("SessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the loading state", () => {
    mockedUseSessions.mockReturnValue({
      sessions: [],
      loading: true,
      error: null,
      revokingSessionId: null,
      deletingSessionId: null,
      refresh: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    });

    render(<SessionsPage />);

    expect(screen.getByRole("region")).toHaveAttribute("aria-busy", "true");
  });

  it("renders authenticated sessions", () => {
    mockedUseSessions.mockReturnValue({
      sessions: [
        createAuthSession({
          id: "session-current",
          current: true,
        }),
        createAuthSession({
          id: "session-other",
          current: false,
        }),
      ],
      loading: false,
      error: null,
      revokingSessionId: null,
      deletingSessionId: null,
      refresh: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    });

    render(<SessionsPage />);

    expect(screen.getByText("Current", { exact: true })).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Revoke",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Revoke",
      }),
    ).toBeInTheDocument();
  });

  it("delegates session revocation to useSessions", async () => {
    const revoke = vi
      .fn<(sessionId: string) => Promise<void>>()
      .mockResolvedValue(undefined);

    mockedUseSessions.mockReturnValue({
      sessions: [
        createAuthSession({
          id: "session-current",
          current: true,
        }),
        createAuthSession({
          id: "session-other",
          current: false,
        }),
      ],
      loading: false,
      error: null,
      revokingSessionId: null,
      deletingSessionId: null,
      refresh: vi.fn().mockResolvedValue(undefined),
      revoke,
      deleteSession: vi.fn().mockResolvedValue(undefined),
    });

    render(<SessionsPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke",
      }),
    );

    await waitFor(() => {
      expect(revoke).toHaveBeenCalledTimes(1);

      expect(revoke).toHaveBeenCalledWith("session-other");
    });
  });

  it("renders the session error", () => {
    mockedUseSessions.mockReturnValue({
      sessions: [],
      loading: false,
      error: "Unable to load your active sessions.",
      revokingSessionId: null,
      deletingSessionId: null,
      refresh: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    });

    render(<SessionsPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load your active sessions.",
    );
  });

  it("renders the empty state", () => {
    mockedUseSessions.mockReturnValue({
      sessions: [],
      loading: false,
      error: null,
      revokingSessionId: null,
      deletingSessionId: null,
      refresh: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    });

    render(<SessionsPage />);

    expect(screen.getByText("No active sessions found.")).toBeInTheDocument();
  });
});
