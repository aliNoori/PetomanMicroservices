import type {
  TenantMembershipStatus,
  TenantStatus,
  TenantType,
} from "@/features/tenant/types";

export interface AuthTenantSummary {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  ownerId: string;
}

export interface AuthTenantMembership {
  membershipId: string;
  tenantId: string;
  status: TenantMembershipStatus;
  tenant: AuthTenantSummary;
}

export interface AuthTenantRole {
  tenantId: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;

  isEmailVerified: boolean;
  emailVerifiedAt: string | null;

  avatarUrl: string | null;

  systemRoles: string[];
  tenantMemberships: AuthTenantMembership[];
  tenantRoles: AuthTenantRole[];

  createdAt: string;
}

export interface AuthProfileResponse extends Omit<AuthUser, "isEmailVerified"> {
  emailVerified: boolean;
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
  tenantMemberships: AuthTenantMembership[];
}
