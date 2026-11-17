
import { useCallback, useEffect, useState } from "react";

import { tenantService } from "../services";

import type {
  TenantMembership,
  TenantMembershipTenant,
} from "../types";

interface UseTenantMembershipsReturn {
  tenant: TenantMembershipTenant | null;
  memberships: TenantMembership[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTenantMemberships(
  tenantId: string,
): UseTenantMembershipsReturn {
  const [tenant, setTenant] = useState<TenantMembershipTenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!tenantId) {
      setTenant(null);
      setMemberships([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await tenantService.getTenantMemberships(tenantId);

      setTenant(response.tenant);
      setMemberships(response.memberships);
    } catch {
      setTenant(null);
      setMemberships([]);
      setError("Failed to load tenant memberships.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    tenant,
    memberships,
    loading,
    error,
    refresh,
  };
}
