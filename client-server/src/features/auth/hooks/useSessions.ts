import { useCallback, useEffect, useState } from "react";

import { authService } from "@/features/auth";

import type { AuthSession } from "@/features/auth";

interface UseSessionsState {
  sessions: AuthSession[];
  loading: boolean;
  error: string | null;
  revokingSessionId: string | null;
  deletingSessionId: string | null;
}

export interface UseSessionsResult extends UseSessionsState {
  refresh: () => Promise<void>;
  revoke: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

/**
 * Manage authenticated user sessions.
 *
 * Responsibilities:
 * - Load authenticated sessions.
 * - Expose loading and error state.
 * - Revoke individual sessions.
 * - Delete inactive session history.
 * - Refresh session data after mutations.
 *
 * Authentication and API communication remain
 * owned by the auth feature.
 */
export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.getSessions();
      setSessions(result);
    } catch {
      setError("Unable to load your active sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(
    async (sessionId: string): Promise<void> => {
      if (revokingSessionId !== null || deletingSessionId !== null) {
        return;
      }

      setRevokingSessionId(sessionId);
      setError(null);

      try {
        await authService.revokeSession(sessionId);
        await refresh();
      } catch {
        setError("Unable to revoke this session.");
      } finally {
        setRevokingSessionId(null);
      }
    },
    [refresh, revokingSessionId, deletingSessionId],
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      if (deletingSessionId !== null || revokingSessionId !== null) {
        return;
      }

      setDeletingSessionId(sessionId);
      setError(null);

      try {
        await authService.deleteSessionHistory(sessionId);
        await refresh();
      } catch {
        setError("Unable to delete this session history.");
      } finally {
        setDeletingSessionId(null);
      }
    },
    [refresh, deletingSessionId, revokingSessionId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    sessions,
    loading,
    error,
    revokingSessionId,
    deletingSessionId,
    refresh,
    revoke,
    deleteSession,
  };
}
