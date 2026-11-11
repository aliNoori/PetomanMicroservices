export interface TenantRejectionDialogProps {
  open: boolean;
  tenantName: string | null;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}