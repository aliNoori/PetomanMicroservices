import type {
  TenantSummary,
} from "./tenant.types";


export interface TenantCardBaseProps {
  tenant: TenantSummary;

  onClick?: (
    tenant: TenantSummary,
  ) => void;
}