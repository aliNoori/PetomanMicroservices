import type {
  AuthUser,
  TenantOption,
} from "../types";

export interface AuthStoreState {
  user: AuthUser | null;

  tenants: TenantOption[];

  selectedTenant: TenantOption | null;

  sessionActive: boolean;

  loading: boolean;

  authenticated: boolean;
}

export const initialAuthState: AuthStoreState = {
  user: null,
  tenants: [],
  selectedTenant: null,
  sessionActive: false,
  loading: true,
  authenticated: false,
};