import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { usePermissions } from "../hooks";

export interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: readonly string[];
  mode?: "all" | "any";
}

export function PermissionGuard({
  children,
  requiredPermissions = [],
  mode = "all",
}: PermissionGuardProps) {
  const {
    hasAllPermissions,
    hasAnyPermission,
  } = usePermissions();

  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess =
    mode === "any"
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}