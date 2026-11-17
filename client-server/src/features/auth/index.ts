/**
 * Auth feature public API.
 *
 * External modules should import
 * authentication functionality only
 * from this file.
 */

export { Sessions, AuthGuard,SystemRoleGuard,WorkspaceTenantGuard } from "./components";

// Hooks
export { useAuth, useSessions } from "./hooks";

export type { UseSessionsResult } from "./hooks";

// Services
export { authService } from "./services";

// Context
export { AuthProvider } from "./context";

export type { AuthContextValue } from "./context";

// Types
export type {
  AuthUser,
  AuthSession,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthState,
} from "./types";

export type {
  RegisterUserRequest,
  RegisterUserResponse,
} from "./types/auth.types";
