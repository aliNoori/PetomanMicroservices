import { useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";

import { Alert } from "@/components/common";

import {
  CreateTenantForm,
  tenantService,
} from "@/features/tenant";

import type {
  CreateTenantRequest,
  CreateTenantResponse,
} from "@/features/tenant";

import type { ApiErrorResponse } from "@/lib/api/api-response.types";

export function CreateTenantPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] =
    useState<CreateTenantResponse["tenant"] | null>(null);

  async function handleSubmit(payload: CreateTenantRequest) {
    setLoading(true);
    setError(null);
    setCreatedTenant(null);

    try {
      const response = await tenantService.createTenant(payload);

      setCreatedTenant(response.tenant);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error)) {
        const errorCode = error.response?.data?.error?.code;

        if (errorCode === "AUTH_TENANT_SLUG_ALREADY_EXISTS") {
          setError(
            "This tenant slug is already in use. Please choose another one.",
          );
          return;
        }

        if (errorCode === "AUTH_USER_INACTIVE") {
          setError("Your account is inactive. You cannot create a tenant.");
          return;
        }

        setError(
          error.response?.data?.error?.message ??
            "Unable to create tenant. Please try again.",
        );

        return;
      }

      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-10">
      {createdTenant ? (
        <div className="w-full max-w-xl space-y-5">
          <Alert variant="success" title="Tenant created successfully">
            Your tenant has been submitted and is waiting for approval.
          </Alert>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {createdTenant.name}
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Slug</dt>
                <dd className="font-medium text-text-primary">
                  {createdTenant.slug}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Status</dt>
                <dd className="font-semibold text-warning">
                  {createdTenant.status}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Tenant ID</dt>
                <dd className="break-all text-text-primary">
                  {createdTenant.id}
                </dd>
              </div>
            </dl>
          </div>

          <Alert variant="info">
            Your tenant is not active yet. It will become available after
            administrator approval.
          </Alert>

          <Link
            to="/"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <CreateTenantForm
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}