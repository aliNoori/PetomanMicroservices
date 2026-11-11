import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { Sessions } from "./Sessions";

import type { AuthSession } from "@/features/auth";

import { createAuthSession } from "@/features/auth/test-utils/session.fixture";

const sessions: AuthSession[] = [
  createAuthSession({
    id: "session-current",
    current: true,
  }),
  createAuthSession({
    id: "session-other",
    current: false,
    status: "active",
  }),
];

function renderSessions(
  overrides: Partial<React.ComponentProps<typeof Sessions>> = {},
) {
  const onRevoke = vi
    .fn<(sessionId: string) => Promise<void>>()
    .mockResolvedValue(undefined);

  const onDelete = vi
    .fn<(sessionId: string) => Promise<void>>()
    .mockResolvedValue(undefined);

  const props: React.ComponentProps<typeof Sessions> = {
    sessions,
    loading: false,
    error: null,
    revokingSessionId: null,
    deletingSessionId: null,
    onRevoke,
    onDelete,
    ...overrides,
  };

  return {
    onRevoke,
    onDelete,
    ...render(<Sessions {...props} />),
  };
}

describe("Sessions", () => {
  it("renders the sessions section", () => {
    renderSessions();

    expect(
      screen.getByRole("heading", {
        name: "Active Sessions",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Devices currently signed in to your account."),
    ).toBeInTheDocument();
  });

  it("renders the current session", () => {
    renderSessions();

    expect(screen.getByText("Current", { exact: true })).toBeInTheDocument();

    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("renders revoke action only for non-current sessions", () => {
    renderSessions();

    expect(
      screen.getByRole("button", {
        name: "Revoke",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", {
        name: "Revoke",
      }),
    ).toHaveLength(1);
  });

  it("calls onRevoke with the selected session id", () => {
    const { onRevoke } = renderSessions();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke",
      }),
    );

    expect(onRevoke).toHaveBeenCalledTimes(1);

    expect(onRevoke).toHaveBeenCalledWith("session-other");
  });

  it("shows revoking state for the selected session", () => {
    renderSessions({
      revokingSessionId: "session-other",
    });

    expect(
      screen.getByRole("button", {
        name: "Revoking...",
      }),
    ).toBeInTheDocument();
  });

  it("disables revoke actions while a session is being revoked", () => {
    renderSessions({
      revokingSessionId: "session-other",
    });

    expect(
      screen.getByRole("button", {
        name: "Revoking...",
      }),
    ).toBeDisabled();
  });

  it("renders the loading state", () => {
    renderSessions({
      loading: true,
    });

    expect(screen.getByRole("region")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the error state", () => {
    renderSessions({
      error: "Unable to load your active sessions.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load your active sessions.",
    );
  });

  it("renders the empty state", () => {
    renderSessions({
      sessions: [],
    });

    expect(screen.getByText("No active sessions found.")).toBeInTheDocument();
  });
});
