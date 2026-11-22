import { useState } from "react";

import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";

import type {
  AuthNavigationState,
  ReturnToLocation,
} from "@/features/auth/types";

function getSafeReturnTo(value?: ReturnToLocation): ReturnToLocation | null {
  if (
    !value ||
    typeof value.pathname !== "string" ||
    !value.pathname.startsWith("/workspace/") ||
    value.pathname.startsWith("//")
  ) {
    return null;
  }

  try {
    const url = new URL(value.pathname, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    return {
      pathname: url.pathname,
      search: value.search ?? "",
      hash: value.hash ?? "",
    };
  } catch {
    return null;
  }
}

export function TenantSelectionPage() {
  const {
    tenants,
    selectedTenant,
    sessionActive,
    authenticated,
    loading,
    selectTenant,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const navigationState = location.state as AuthNavigationState | null;

  const returnTo = getSafeReturnTo(navigationState?.returnTo);

  if (loading) {
    return <p>Restoring your session...</p>;
  }

  if (!sessionActive) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: returnTo ?? { pathname: "/workspace" },
        }}
      />
    );
  }

  if (authenticated && selectedTenant) {
    const tenantBasePath = `/workspace/${selectedTenant.id}`;

    const isMatchingTenant =
      returnTo?.pathname === tenantBasePath ||
      returnTo?.pathname.startsWith(`${tenantBasePath}/`);

    const destination = isMatchingTenant
      ? returnTo!
      : {
          pathname: `${tenantBasePath}/dashboard`,
        };

    return <Navigate to={destination} replace />;
  }

  async function handleContinue(): Promise<void> {
    if (!selectedTenantId) {
      setError("Please select a tenant.");
      return;
    }

    setError(null);

    try {
      await selectTenant(selectedTenantId);

      const tenantBasePath = `/workspace/${selectedTenantId}`;

      const isMatchingTenant =
        returnTo?.pathname === tenantBasePath ||
        returnTo?.pathname.startsWith(`${tenantBasePath}/`);

      const destination = isMatchingTenant
        ? returnTo!
        : {
            pathname: `${tenantBasePath}/dashboard`,
          };

      navigate(destination, {
        replace: true,
      });
    } catch {
      setError("Unable to select this tenant. Please try again.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Select a workspace</h1>

      <p className="mb-6 text-sm text-gray-500">
        Choose the tenant you want to continue with.
      </p>

      {tenants.length === 0 ? (
        <p>No active tenant memberships were found for your account.</p>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => {
                setSelectedTenantId(tenant.id);
                setError(null);
              }}
              aria-pressed={selectedTenantId === tenant.id}
              className={[
                "w-full rounded-lg border p-4 text-left transition",
                selectedTenantId === tenant.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-400",
              ].join(" ")}
            >
              <span className="block font-medium">{tenant.name}</span>

              <span className="mt-1 block text-sm text-gray-500">
                {tenant.slug}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-500">
          Don't have a workspace yet, or want to create a new one?
        </p>

        <Link
          to="/tenants/create"
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-blue-600 px-4 py-3 font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Create a new tenant
        </Link>
      </div>

      <button
        type="button"
        disabled={!selectedTenantId || loading || tenants.length === 0}
        onClick={handleContinue}
        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </main>
  );
}
