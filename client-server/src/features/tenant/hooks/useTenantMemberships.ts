
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
  actionError: string | null;
  processingMembershipId: string | null;
  refresh: () => Promise<void>;
  approveMembership: (membershipId: string) => Promise<void>;
  rejectMembership: (membershipId: string) => Promise<void>;
}

export function useTenantMemberships(
  tenantId: string,
): UseTenantMembershipsReturn {
  const [tenant, setTenant] = useState<TenantMembershipTenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingMembershipId, setProcessingMembershipId] = useState<
    string | null
  >(null);

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

  const approveMembership = useCallback(
    async (membershipId: string): Promise<void> => {
      if (processingMembershipId) return;

      setProcessingMembershipId(membershipId);
      setActionError(null);

      try {
        await tenantService.approveTenantMembership(membershipId);
        await refresh();
      } catch {
        setActionError("Failed to approve membership request.");
      } finally {
        setProcessingMembershipId(null);
      }
    },
    [processingMembershipId, refresh],
  );

  const rejectMembership = useCallback(
    async (membershipId: string): Promise<void> => {
      if (processingMembershipId) return;

      setProcessingMembershipId(membershipId);
      setActionError(null);

      try {
        await tenantService.rejectTenantMembership(membershipId);
        await refresh();
      } catch {
        setActionError("Failed to reject membership request.");
      } finally {
        setProcessingMembershipId(null);
      }
    },
    [processingMembershipId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    tenant,
    memberships,
    loading,
    error,
    actionError,
    processingMembershipId,
    refresh,
    approveMembership,
    rejectMembership,
  };
}
