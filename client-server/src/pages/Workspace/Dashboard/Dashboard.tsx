
import { useAuth } from "@/features/auth";

const tenantTypeLabels: Record<string, string> = {
  markets: "Online Store",
  vets: "Veterinary Clinic",
  pharmacies: "Pharmacy",
};

export function DashboardPage() {
  const { selectedTenant } = useAuth();

  if (!selectedTenant) {
    return null;
  }

  const tenantType =
    tenantTypeLabels[selectedTenant.type] ?? "Workspace";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">
          {tenantType}
        </p>

        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Welcome to {selectedTenant.name}
        </h1>

        <p className="text-sm text-text-secondary">
          Manage your workspace, products, orders, and business settings.
        </p>
      </header>

      <section
        aria-labelledby="workspace-overview-title"
        className="space-y-4"
      >
        <h2
          id="workspace-overview-title"
          className="text-lg font-semibold text-text-primary"
        >
          Workspace overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-secondary">
              Workspace name
            </p>

            <p className="mt-2 font-semibold text-text-primary">
              {selectedTenant.name}
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-secondary">
              Workspace type
            </p>

            <p className="mt-2 font-semibold text-text-primary">
              {tenantType}
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-secondary">
              Workspace identifier
            </p>

            <p className="mt-2 break-all font-semibold text-text-primary">
              {selectedTenant.slug}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
