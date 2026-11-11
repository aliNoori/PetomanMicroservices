import {
  TenantCardRenderer,
} from "@/features/tenant";

import type {
  TenantSectionProps,
} from "@/features/tenant";


export function NearbyTenantsSection({
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
              <TenantCardRenderer
                key={tenant.id}
                tenant={tenant}
              />
            ))}

          </div>
        )}
      </div>

    </section>
  );
}