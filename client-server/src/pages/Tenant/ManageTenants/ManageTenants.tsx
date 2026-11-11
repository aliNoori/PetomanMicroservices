import { useState } from "react";

import {
  PendingTenantList,
  TenantApprovalDialog,
  TenantRejectionDialog,
  usePendingTenants,
} from "@/features/tenant";

import type { PendingTenant } from "@/features/tenant";

export function ManageTenants() {
  const {
    tenants,
    total,
    loading,
    error,
    actionTenantId,
    refresh,
    approve,
    reject,
  } = usePendingTenants();

  const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(
    null,
  );

  const [dialogType, setDialogType] = useState<"approve" | "reject" | null>(
    null,
  );

  const handleApprove = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);

    if (!tenant) return;

    setSelectedTenant(tenant);
    setDialogType("approve");
  };

  const handleReject = (tenant: PendingTenant) => {
    setSelectedTenant(tenant);
    setDialogType("reject");
  };

  const handleCloseDialog = () => {
    if (actionTenantId) return;

    setDialogType(null);
    setSelectedTenant(null);
  };

  const handleConfirmApproval = async () => {
    if (!selectedTenant) return;

    try {
      await approve(selectedTenant.id);
      setDialogType(null);
      setSelectedTenant(null);
    } catch {
      // The hook exposes the operation error.
    }
  };

  const handleConfirmRejection = async (reason: string) => {
    if (!selectedTenant) return;

    try {
      await reject(selectedTenant.id, { reason });
      setDialogType(null);
      setSelectedTenant(null);
    } catch {
      // The hook exposes the operation error.
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Pending Tenant Management
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            Review and manage tenant registration requests.
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          Pending requests: {total}
        </div>
      </header>

      <PendingTenantList
        tenants={tenants}
        loading={loading}
        error={error}
        actionTenantId={actionTenantId}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TenantApprovalDialog
        open={dialogType === "approve"}
        tenantName={selectedTenant?.name ?? null}
        loading={actionTenantId !== null}
        onConfirm={handleConfirmApproval}
        onCancel={handleCloseDialog}
      />

      <TenantRejectionDialog
        open={dialogType === "reject"}
        tenantName={selectedTenant?.name ?? null}
        loading={actionTenantId !== null}
        onConfirm={handleConfirmRejection}
        onCancel={handleCloseDialog}
      />
    </section>
  );
}
