import { useAuth } from "./useAuth";

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../utils/permissions";

export function usePermissions() {
  const { permissions } = useAuth();

  return {
    permissions,
    hasPermission: (permission: string) =>
      hasPermission(permissions, permission),
    hasAllPermissions: (requiredPermissions: readonly string[]) =>
      hasAllPermissions(permissions, requiredPermissions),
    hasAnyPermission: (requiredPermissions: readonly string[]) =>
      hasAnyPermission(permissions, requiredPermissions),
  };
}