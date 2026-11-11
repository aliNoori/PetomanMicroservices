import type {
  TenantSummary,
  VetTenantSummary,
} from "@/features/tenant";


export type TenantListItem =
  | TenantSummary
  | VetTenantSummary;