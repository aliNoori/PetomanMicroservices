import { apiClient } from "@/lib/api/client";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SelectTenantRequest,
  SelectTenantResponse,
  AuthUser,
  ChangePasswordRequest,
  AuthSession,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
  RegisterUserRequest,
  RegisterUserResponse,
} from "../types/auth.types";

class AuthService {
  async register(payload: RegisterUserRequest): Promise<RegisterUserResponse> {
    return apiClient.post<RegisterUserResponse>("/auth/register", payload, {
      skipAuthRefresh: true,
    });
  }
  /**
   * Authenticate user and create access/refresh tokens.
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", payload, {
      skipAuthRefresh: true,
    });
  }

  /**
   * Select an active tenant and establish its authorization context.
   *
   * The backend issues a tenant-scoped access token
   * and updates the current refresh-token session.
   */
  async selectTenant(
    payload: SelectTenantRequest,
  ): Promise<SelectTenantResponse> {
    return apiClient.post<SelectTenantResponse>("/auth/tenant/select", payload);
  }

  /**
   * Exchange refresh token for a new token pair.
   *
   * Backend rotates refresh tokens:
   * old token is revoked.
   * new refresh token is issued.
   */
  async refresh(payload: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>("/auth/refresh", payload);
  }

  /**
   * Revoke current refresh token session.
   */
  async logout(payload: RefreshTokenRequest): Promise<void> {
    await apiClient.post<void>("/auth/logout", payload);
  }

  /**
   * Get authenticated user profile.
   */
  async getMe(): Promise<AuthUser> {
    return apiClient.get<AuthUser>("/auth/profile");
  }

  /**
   * Change the authenticated user's password.
   *
   * The backend validates the current password,
   * stores the new password, and revokes all
   * existing refresh-token sessions.
   */
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.patch<void>("/auth/change-password", payload);
  }
  /**
   * Get all refresh-token sessions
   * belonging to the authenticated user.
   */
  async getSessions(): Promise<AuthSession[]> {
    return apiClient.get<AuthSession[]>("/auth/sessions");
  }

  /**
   * Revoke a specific authenticated user's session.
   */
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete<void>(`/auth/sessions/${sessionId}`);
  }

  async deleteSessionHistory(sessionId: string): Promise<void> {
    await apiClient.delete<void>(`/auth/sessions/${sessionId}/history`);
  }

  /**
   * Verify a user's email address using a one-time token.
   */
  async verifyEmail(
    payload: VerifyEmailRequest,
  ): Promise<{ verified: boolean }> {
    return apiClient.post<{ verified: boolean }>(
      "/auth/email-verification/verify",
      payload,
      { skipAuthRefresh: true },
    );
  }

  /**
   * Request a new email verification link.
   */
  async resendVerificationEmail(
    payload: ResendVerificationEmailRequest,
  ): Promise<void> {
    await apiClient.post<void>("/auth/email-verification/resend", payload, {
      skipAuthRefresh: true,
    });
  }
}

export const authService = new AuthService();
