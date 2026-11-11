import type { PendingTenantListProps } from "./PendingTenantList.types";

export function PendingTenantList({
  tenants,
  loading,
  error,
  actionTenantId,
  onApprove,
  onReject,
}: PendingTenantListProps) {
  if (loading) {
    return (
      <div role="status" aria-busy="true">
        Loading pending tenants...
      </div>
    );
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (tenants.length === 0) {
    return <p>No pending tenants found.</p>;
  }

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => {
        const isProcessing = actionTenantId === tenant.id;

        return (
          <article
            key={tenant.id}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-text-primary">
                  {tenant.name}
                </h3>

                <p className="text-sm text-text-secondary">
                  Slug: {tenant.slug}
                </p>

                <p className="text-sm text-text-secondary">
                  Owner ID: {tenant.ownerId}
                </p>

                <p className="text-sm text-text-secondary">
                  Created: {new Date(tenant.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionTenantId !== null}
                  onClick={() => onApprove(tenant.id)}
                  className="rounded-md bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>

                <button
                  type="button"
                  disabled={actionTenantId !== null}
                  onClick={() => onReject(tenant)}
                  className="rounded-md bg-red-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}