import type { CreateTenantRequest } from "../../types/tenant.types";

export interface CreateTenantFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (payload: CreateTenantRequest) => Promise<void>;
}