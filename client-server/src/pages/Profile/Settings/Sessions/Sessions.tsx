import { useSessions,Sessions } from "@/features/auth";

/**
 * Authenticated session management page.
 *
 * This page composes the authentication session
 * hook with the session presentation component.
 *
 * Session API communication and session lifecycle
 * management remain owned by the auth feature.
 */
export function SessionsPage() {
  const {
    sessions,
    loading,
    error,
    revokingSessionId,
    revoke,
    deletingSessionId,
    deleteSession,
  } = useSessions();

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Sessions
        sessions={sessions}
        loading={loading}
        error={error}
        revokingSessionId={revokingSessionId}
        onRevoke={revoke}
        deletingSessionId={deletingSessionId}
        onDelete={deleteSession}
      />
    </div>
  );
}
