import type {
  TenantType,
} from "@/features/tenant";

import {
  marketTheme,
  pharmacyTheme,
  vetTheme,
} from "@/features/tenant";


export function getTenantTheme(
  tenantType: TenantType,
) {
  switch (tenantType) {
    case "markets":
      return marketTheme;

    case "vets":
      return vetTheme;

    case "pharmacies":
      return pharmacyTheme;
  }
}