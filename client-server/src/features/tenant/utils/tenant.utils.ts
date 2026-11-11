import type { TenantType } from "../types";

const TENANT_TYPES: readonly TenantType[] = [
  "markets",
  "vets",
  "pharmacies",
];

export function isTenantType(
  value: string | undefined,
): value is TenantType {
  return (
    value !== undefined &&
    TENANT_TYPES.includes(
      value as TenantType,
    )
  );
}