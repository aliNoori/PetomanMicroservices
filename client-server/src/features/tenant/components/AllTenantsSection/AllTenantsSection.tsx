import type { TenantSectionProps } from "@/features/tenant";

export function AllTenantsSection({
  title,
  tenants,
}: TenantSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          {title}
        </h2>
      </div>

      <div>
        {tenants.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No tenants available.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <div key={tenant.id}>
                {tenant.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}