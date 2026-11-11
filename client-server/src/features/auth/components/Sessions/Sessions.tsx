
import type { SessionsProps } from "./Sessions.types";

/**
 * Format a session timestamp for human-readable display.
 */
function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

/**
 * Render a reusable session information field.
 */
function SessionField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
      <dt className="font-medium text-text-muted">{label}:</dt>
      <dd className="text-text-secondary">{value || "Unknown"}</dd>
    </div>
  );
}

export function Sessions({
  sessions,
  loading,
  error,
  revokingSessionId,
  deletingSessionId,
  onRevoke,
  onDelete,
}: SessionsProps) {
  const activeSessions = sessions.filter(
    (session) => session.status === "active",
  );

  const inactiveSessions = sessions.filter(
    (session) => session.status !== "active",
  );

  if (loading) {
    return (
      <section
        aria-label="Session management"
        aria-busy="true"
        className="rounded-xl border border-border bg-surface p-6"
      >
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-72 animate-pulse rounded bg-surface-secondary" />
          <div className="h-24 animate-pulse rounded-lg bg-surface-secondary" />
          <div className="h-24 animate-pulse rounded-lg bg-surface-secondary" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Active Sessions */}

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Active Sessions
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              Devices currently signed in to your account.
            </p>
          </div>

          <span className="w-fit rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
            {activeSessions.length}{" "}
            {activeSessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              No active sessions found.
            </p>

            <p className="mt-1 text-sm text-text-secondary">
              Your active sessions will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {activeSessions.map((session) => {
              const isRevoking = revokingSessionId === session.id;

              return (
                <article
                  key={session.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {session.device || "Unknown Device"}
                        </h3>

                        {session.current && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                            Current
                          </span>
                        )}
                      </div>

                      <dl className="mt-3 space-y-2 text-sm">
                        <SessionField
                          label="Operating System"
                          value={session.operating_system}
                        />

                        <SessionField
                          label="Browser"
                          value={session.browser}
                        />

                        <SessionField
                          label="Created"
                          value={formatDate(session.created_at)}
                        />

                        <SessionField
                          label="Last Activity"
                          value={formatDate(session.last_token_issued_at)}
                        />

                        <SessionField
                          label="Expires"
                          value={formatDate(session.expires_at)}
                        />

                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                          <dt className="font-medium text-text-muted">
                            Session ID:
                          </dt>

                          <dd
                            className="truncate font-mono text-xs text-text-secondary"
                            title={session.id}
                          >
                            {session.id}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {!session.current && (
                      <button
                        type="button"
                        onClick={() => void onRevoke(session.id)}
                        disabled={
                          revokingSessionId !== null ||
                          deletingSessionId !== null
                        }
                        className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRevoking ? "Revoking..." : "Revoke"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive Sessions */}

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Inactive Sessions
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              Previously revoked or expired sessions.
            </p>
          </div>

          <span className="w-fit rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
            {inactiveSessions.length}{" "}
            {inactiveSessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {inactiveSessions.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              No inactive sessions.
            </p>

            <p className="mt-1 text-sm text-text-secondary">
              Revoked and expired sessions will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {inactiveSessions.map((session) => {
              const isDeleting = deletingSessionId === session.id;

              return (
                <article
                  key={session.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {session.device || "Unknown Device"}
                        </h3>

                        <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {session.status === "revoked"
                            ? "Revoked"
                            : "Expired"}
                        </span>
                      </div>

                      <dl className="mt-3 space-y-2 text-sm">
                        <SessionField
                          label="Operating System"
                          value={session.operating_system}
                        />

                        <SessionField
                          label="Browser"
                          value={session.browser}
                        />

                        <SessionField
                          label="Created"
                          value={formatDate(session.created_at)}
                        />

                        <SessionField
                          label="Last Activity"
                          value={formatDate(session.last_token_issued_at)}
                        />

                        <SessionField
                          label="Expires"
                          value={formatDate(session.expires_at)}
                        />

                        {session.revoked_at && (
                          <SessionField
                            label="Revoked"
                            value={formatDate(session.revoked_at)}
                          />
                        )}
                      </dl>
                    </div>

                    <button
                      type="button"
                      onClick={() => void onDelete(session.id)}
                      disabled={
                        deletingSessionId !== null ||
                        revokingSessionId !== null
                      }
                      className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete History"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}