import {
  TenantCardRenderer,
} from "@/features/tenant";

import type {
  TenantSectionProps,
} from "@/features/tenant";


export function OnlineTenantsSection({
  title,
  tenants,
}: TenantSectionProps) {
  const onlineTenants = tenants.filter(
    (tenant) => tenant.isOnline === true,
  );


  return (
    <section className="space-y-4">

      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          {title}
        </h2>
      </div>

      <div>
        {onlineTenants.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No online tenants available.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {onlineTenants.map((tenant) => (
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