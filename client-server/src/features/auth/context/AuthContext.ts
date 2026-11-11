import { createContext } from "react";

import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  AuthUser,
} from "../types";

import type {
  AuthStoreState,
} from "../store/auth.store";

export interface AuthContextValue extends AuthStoreState {
  login(payload: LoginRequest): Promise<LoginResponse>;

  selectTenant(tenantId: string): Promise<void>;

  logout(): Promise<void>;

  refreshUser(): Promise<AuthUser | null>;

  changePassword(payload: ChangePasswordRequest): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);