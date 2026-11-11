export interface TenantApprovalDialogProps {
  open: boolean;
  tenantName: string | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}