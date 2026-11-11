import { useEffect, useState } from "react";

import type { TenantRejectionDialogProps } from "./TenantRejectionDialog.types";

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 1000;

export function TenantRejectionDialog({
  open,
  tenantName,
  loading,
  onConfirm,
  onCancel,
}: TenantRejectionDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open, tenantName]);

  if (!open) {
    return null;
  }

  const trimmedReason = reason.trim();

  const isValid =
    trimmedReason.length >= MIN_REASON_LENGTH &&
    trimmedReason.length <= MAX_REASON_LENGTH;

  function handleSubmit() {
    if (!isValid || loading) {
      return;
    }

    onConfirm(trimmedReason);
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
        aria-labelledby="tenant-rejection-title"
        className="w-full max-w-md space-y-5 rounded-xl bg-surface p-6 shadow-xl"
      >
        <div className="space-y-2">
          <h2
            id="tenant-rejection-title"
            className="text-lg font-semibold text-text-primary"
          >
            Reject Tenant
          </h2>

          <p className="text-sm text-text-secondary">
            Please provide a reason for rejecting{" "}
            <strong>{tenantName}</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tenant-rejection-reason"
            className="text-sm font-medium"
          >
            Rejection reason
          </label>

          <textarea
            id="tenant-rejection-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={MAX_REASON_LENGTH}
            rows={4}
            disabled={loading}
            aria-describedby="tenant-rejection-hint"
            className="w-full rounded-md border border-border bg-transparent p-3 text-text-primary disabled:opacity-50"
            placeholder="Explain why this tenant is being rejected..."
          />

          <div
            id="tenant-rejection-hint"
            className="flex justify-between text-xs text-text-secondary"
          >
            <span>Minimum 5 characters</span>
            <span>{reason.length}/{MAX_REASON_LENGTH}</span>
          </div>
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
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className="rounded-md bg-red-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </section>
    </div>
  );
}