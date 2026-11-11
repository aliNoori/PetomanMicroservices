import type { TenantApprovalDialogProps } from "./TenantApprovalDialog.types";

export function TenantApprovalDialog({
  open,
  tenantName,
  loading,
  onConfirm,
  onCancel,
}: TenantApprovalDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-approval-title"
        className="w-full max-w-md space-y-5 rounded-xl bg-surface p-6 shadow-xl"
      >
        <div className="space-y-2">
          <h2
            id="tenant-approval-title"
            className="text-lg font-semibold text-text-primary"
          >
            Approve Tenant
          </h2>

          <p className="text-sm text-text-secondary">
            Are you sure you want to approve{" "}
            <strong>{tenantName}</strong>?
          </p>

          <p className="text-sm text-text-secondary">
            The tenant will become active after approval.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-md bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Approving..." : "Confirm Approval"}
          </button>
        </div>
      </section>
    </div>
  );
}