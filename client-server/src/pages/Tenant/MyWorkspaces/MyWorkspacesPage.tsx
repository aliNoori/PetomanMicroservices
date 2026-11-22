
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";

import type { AuthTenantMembership } from "@/features/auth/types";

const membershipStatusLabels: Record<
  AuthTenantMembership["status"],
  string
> = {
  ACTIVE: "Active membership",
  PENDING: "Membership pending",
  REJECTED: "Membership rejected",
};

const tenantStatusLabels: Record<
  AuthTenantMembership["tenant"]["status"],
  string
> = {
  ACTIVE: "Workspace active",
  PENDING: "Workspace pending approval",
  REJECTED: "Workspace rejected",
};

const statusClasses: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

const tenantTypeLabels: Record<string, string> = {
  markets: "Market",
  vets: "Veterinary clinic",
  pharmacies: "Pharmacy",
};

function StatusLabel({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        statusClasses[status] ?? "bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function MembershipCard({
  membership,
}: {
  membership: AuthTenantMembership;
}) {
  const navigate = useNavigate();

  const { tenant } = membership;

  const canOpenWorkspace =
    membership.status === "ACTIVE" && tenant.status === "ACTIVE";

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-text-primary">
            {tenant.name}
          </h2>

          <p className="mt-1 text-sm text-text-secondary">
            {tenant.slug}
          </p>

          <p className="mt-2 text-xs text-text-muted">
            {tenantTypeLabels[tenant.type] ?? tenant.type}
          </p>
        </div>

        {canOpenWorkspace && (
          <button
            type="button"
            onClick={() =>
              navigate(`/workspace/${tenant.id}/dashboard`)
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open workspace
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <StatusLabel
          status={membership.status}
          label={membershipStatusLabels[membership.status]}
        />

        <StatusLabel
          status={tenant.status}
          label={tenantStatusLabels[tenant.status]}
        />
      </div>
    </article>
  );
}

export function MyWorkspacesPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const memberships = user.tenantMemberships ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            My workspaces
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Manage your workspace memberships and access status.
          </p>
        </div>

        <Link
          to="/tenants/create"
          className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
        >
          Create workspace
        </Link>
      </header>

      {memberships.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border p-8 text-center">
          <h2 className="font-semibold text-text-primary">
            No workspaces yet
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            You haven't joined or created any workspaces yet.
          </p>

          <Link
            to="/tenants/create"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Create your first workspace
          </Link>
        </section>
      ) : (
        <section
          aria-label="Workspace memberships"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {memberships.map((membership) => (
            <MembershipCard
              key={membership.membershipId}
              membership={membership}
            />
          ))}
        </section>
      )}
    </main>
  );
}
