import type { PendingTenant } from "../../types";

export interface PendingTenantListProps {
  tenants: PendingTenant[];
  loading: boolean;
  error: string | null;
  actionTenantId: string | null;
  onApprove: (tenantId: string) => void;
  onReject: (tenant: PendingTenant) => void;
}