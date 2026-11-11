import { useCallback, useEffect, useState } from "react";

import { tenantService } from "../services";

import type {
  PendingTenant,
  RejectTenantRequest,
} from "../types";

interface UsePendingTenantsReturn {
  tenants: PendingTenant[];
  total: number;
  loading: boolean;
  error: string | null;
  actionTenantId: string | null;
  refresh: () => Promise<void>;
  approve: (tenantId: string) => Promise<void>;
  reject: (
    tenantId: string,
    payload: RejectTenantRequest,
  ) => Promise<void>;
}

export function usePendingTenants(): UsePendingTenantsReturn {
  const [tenants, setTenants] = useState<PendingTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTenantId, setActionTenantId] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await tenantService.getPendingTenants();

      setTenants(response.items);
      setTotal(response.total);
    } catch {
      setError("Failed to load pending tenants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = useCallback(async (tenantId: string): Promise<void> => {
    setActionTenantId(tenantId);
    setError(null);

    try {
      await tenantService.approveTenant(tenantId);
      await refresh();
    } catch {
      setError("Failed to approve tenant.");
      throw new Error("Failed to approve tenant.");
    } finally {
      setActionTenantId(null);
    }
  }, [refresh]);

  const reject = useCallback(async (
    tenantId: string,
    payload: RejectTenantRequest,
  ): Promise<void> => {
    setActionTenantId(tenantId);
    setError(null);

    try {
      await tenantService.rejectTenant(tenantId, payload);
      await refresh();
    } catch {
      setError("Failed to reject tenant.");
      throw new Error("Failed to reject tenant.");
    } finally {
      setActionTenantId(null);
    }
  }, [refresh]);

  return {
    tenants,
    total,
    loading,
    error,
    actionTenantId,
    refresh,
    approve,
    reject,
  };
}