
import {
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";

import { useAuth } from "@/features/auth";

export function WorkspaceTenantGuard() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { selectedTenant } = useAuth();

  if (!selectedTenant) {
    return <Navigate to="/auth/select-tenant" replace />;
  }

  if (tenantId !== selectedTenant.id) {
    return (
      <Navigate
        to={`/workspace/${selectedTenant.id}/dashboard`}
        replace
      />
    );
  }

  return <Outlet />;
}
