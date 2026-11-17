import type { TenantType } from "@/features/tenant/types";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;

  isEmailVerified: boolean;
  emailVerifiedAt: string | null;

  avatarUrl: string | null;

  systemRoles: string[];
  tenantMemberships: unknown[];
  tenantRoles: unknown[];

  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tenants: TenantOption[];
}

export interface TenantOption {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
}

export interface SelectTenantRequest {
  tenantId: string;
  refresh_token: string;
}

export interface SelectTenantResponse {
  accessToken: string;
  tenant: TenantOption;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
}

export type SessionStatus = "active" | "revoked" | "expired";

export interface AuthSession {
  id: string;
  current: boolean;
  status: SessionStatus;

  device: string | null;
  operating_system: string | null;
  browser: string | null;

  created_at: string;
  last_token_issued_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  tenantMemberships: unknown[];
}
