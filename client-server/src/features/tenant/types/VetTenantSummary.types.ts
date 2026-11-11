import type { TenantSummary } from "./tenant.types";

export interface VetTenantSummary extends Omit<TenantSummary, "type"> {
  type: "vets";
  coverImageUrl?: string;
  avatarUrl?: string;
  specialty?: string;
  consultationAvailable?: boolean;
}
