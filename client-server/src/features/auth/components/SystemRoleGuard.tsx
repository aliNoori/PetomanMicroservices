
import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "@/features/auth";

import { Loading } from "@/components/common";

interface SystemRoleGuardProps {
  requiredRole: string;
  children?: ReactNode;
}

export function SystemRoleGuard({
  requiredRole,
  children,
}: SystemRoleGuardProps) {
  const {
    user,
    sessionActive,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!sessionActive) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const hasRequiredRole =
    user?.systemRoles?.includes(requiredRole) ?? false;

  if (!hasRequiredRole) {
    return <Navigate to="/403" replace />;
  }

  return children ?? <Outlet />;
}
