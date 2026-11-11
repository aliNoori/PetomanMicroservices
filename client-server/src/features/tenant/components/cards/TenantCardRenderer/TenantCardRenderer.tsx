import {
  MarketTenantCard,
  PharmacyTenantCard,
  VetTenantCard,
} from "@/features/tenant";

import type {
  TenantCardBaseProps,
} from "@/features/tenant";

import type {
  TenantSummary,
  VetTenantSummary,
} from "@/features/tenant";

function isVetTenantSummary(
  tenant: TenantSummary,
): tenant is VetTenantSummary {
  return tenant.type === "vets";
}


export function TenantCardRenderer({
  tenant,
  onClick,
}: TenantCardBaseProps) {
  switch (tenant.type) {
    case "markets":
      return (
        <MarketTenantCard
          tenant={tenant}
          onClick={onClick}
        />
      );

    case "vets":
  if (!isVetTenantSummary(tenant)) {
    return null;
  }

  return (
    <VetTenantCard
      tenant={tenant}
      onClick={onClick}
    />
  );

    case "pharmacies":
      return (
        <PharmacyTenantCard
          tenant={tenant}
          onClick={onClick}
        />
      );

    default:
      return null;
  }
}