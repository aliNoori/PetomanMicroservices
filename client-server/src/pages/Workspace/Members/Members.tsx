
import { useParams } from "react-router-dom";

import { useTenantMemberships } from "@/features/tenant";

const membershipStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

const membershipStatusClasses: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  REJECTED: "bg-danger/10 text-danger",
};

export function MembersPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  const {
    tenant,
    memberships,
    loading,
    error,
    actionError,
    processingMembershipId,
    refresh,
    approveMembership,
    rejectMembership,
  } = useTenantMemberships(tenantId ?? "");

  const formatDate = (value: string): string => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(value));
  };

  const activeMembersCount = memberships.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const isProcessing = processingMembershipId !== null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Members
          </h1>

          <p className="text-sm text-text-secondary">
            Manage workspace members, their membership status, and assigned roles.
          </p>

          {tenant && (
            <p className="text-sm font-medium text-primary">
              {tenant.name}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || isProcessing}
          className="
            inline-flex items-center justify-center
            rounded-lg border border-border
            bg-surface px-4 py-2
            text-sm font-medium text-text-primary
            transition-colors hover:bg-surface-secondary
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {loading ? (
        <section
          aria-label="Loading members"
          className="rounded-xl border border-border bg-surface p-10 text-center"
        >
          <p className="text-sm text-text-secondary">
            Loading workspace members...
          </p>
        </section>
      ) : error ? (
        <section
          role="alert"
          className="space-y-4 rounded-xl border border-danger/30 bg-surface p-8 text-center"
        >
          <h2 className="text-lg font-semibold text-text-primary">
            Unable to load members
          </h2>

          <p className="text-sm text-text-secondary">{error}</p>

          <button
            type="button"
            onClick={() => void refresh()}
            className="
              rounded-lg bg-primary px-4 py-2
              text-sm font-medium text-white
              transition-opacity hover:opacity-90
            "
          >
            Try again
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-text-secondary">Total members</p>

              <p className="mt-2 text-2xl font-bold text-text-primary">
                {memberships.length}
              </p>
            </article>

            <article className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-text-secondary">Active members</p>

              <p className="mt-2 text-2xl font-bold text-text-primary">
                {activeMembersCount}
              </p>
            </article>
          </section>

          {actionError && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
            >
              {actionError}
            </div>
          )}

          {memberships.length === 0 ? (
            <section
              aria-label="Members"
              className="rounded-xl border border-border bg-surface p-10 text-center"
            >
              <h2 className="text-lg font-semibold text-text-primary">
                No members found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                There are currently no members associated with this workspace.
              </p>
            </section>
          ) : (
            <section
              aria-label="Workspace members"
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 text-left text-sm">
                  <thead className="border-b border-border bg-background">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-text-secondary">
                        Member
                      </th>

                      <th className="px-5 py-4 font-semibold text-text-secondary">
                        Roles
                      </th>

                      <th className="px-5 py-4 font-semibold text-text-secondary">
                        Status
                      </th>

                      <th className="px-5 py-4 font-semibold text-text-secondary">
                        Joined
                      </th>

                      <th className="px-5 py-4 font-semibold text-text-secondary">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {memberships.map((membership) => {
                      const fullName = [
                        membership.user?.firstName,
                        membership.user?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      const isCurrentRowProcessing =
                        processingMembershipId === membership.membershipId;

                      return (
                        <tr
                          key={membership.membershipId}
                          className="transition-colors hover:bg-background/60"
                        >
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <p className="font-medium text-text-primary">
                                {fullName || "Unnamed member"}
                              </p>

                              <p className="text-xs text-text-secondary">
                                {membership.user?.email ?? "No email available"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {membership.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {membership.roles.map((role) => (
                                  <span
                                    key={role.roleId}
                                    className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary"
                                  >
                                    {role.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-text-secondary">
                                No roles
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                membershipStatusClasses[membership.status] ??
                                "bg-surface-secondary text-text-secondary"
                              }`}
                            >
                              {membershipStatusLabels[membership.status] ??
                                membership.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-text-secondary">
                            {formatDate(membership.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            {membership.status === "PENDING" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void approveMembership(membership.membershipId)
                                  }
                                  disabled={isProcessing}
                                  className="
                                    rounded-lg bg-success px-3 py-2
                                    text-xs font-medium text-white
                                    transition-opacity hover:opacity-90
                                    disabled:cursor-not-allowed disabled:opacity-50
                                  "
                                >
                                  {isCurrentRowProcessing
                                    ? "Processing..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void rejectMembership(membership.membershipId)
                                  }
                                  disabled={isProcessing}
                                  className="
                                    rounded-lg border border-danger/30
                                    px-3 py-2 text-xs font-medium text-danger
                                    transition-colors hover:bg-danger/5
                                    disabled:cursor-not-allowed disabled:opacity-50
                                  "
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-text-secondary">
                                No actions available
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
