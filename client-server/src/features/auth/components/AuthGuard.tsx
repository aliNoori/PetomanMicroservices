import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "@/features/auth";

import { Loading } from "@/components/common";

interface AuthGuardProps {
  children?: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const {
    authenticated,
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

  const canAccessWithoutTenant =
  location.pathname === "/tenants/create";

if (!authenticated && !canAccessWithoutTenant) {
    return (
      <Navigate
        to="/auth/select-tenant"
        replace
        state={{
          returnTo: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  return children ?? <Outlet />;
}