import type { AuthSession } from "../types/auth.types";

export function createAuthSession(
  overrides: Partial<AuthSession> = {},
): AuthSession {
  return {
    id: "session-default",
    current: false,
    status: "active",
    device: null,
    operating_system: null,
    browser: null,
    created_at: "2026-08-15T08:00:00Z",
    last_token_issued_at: "2026-08-15T09:00:00Z",
    expires_at: "2026-08-16T08:00:00Z",
    revoked_at: null,
    ...overrides,
  };
}