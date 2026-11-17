
import { useState, type FormEvent } from "react";

import { Alert, Button, Card, Input } from "@/components/common";

import type {
  CreateTenantRequest,
  TenantType,
} from "../../types/tenant.types";
import type { CreateTenantFormProps } from "./CreateTenantForm.types";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TENANT_TYPES: {
  value: TenantType;
  label: string;
}[] = [
  { value: "markets", label: "Market" },
  { value: "vets", label: "Veterinary Clinic" },
  { value: "pharmacies", label: "Pharmacy" },
];

function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateTenantForm({
  loading,
  error,
  onSubmit,
}: CreateTenantFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<TenantType>("markets");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    setNameError(null);

    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
      setSlugError(null);
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase());
    setSlugError(null);
  }

  function validate(): boolean {
    let valid = true;

    const normalizedName = name.trim();
    const normalizedSlug = slug.trim();

    if (!normalizedName) {
      setNameError("Tenant name is required.");
      valid = false;
    } else if (normalizedName.length > 150) {
      setNameError("Tenant name cannot exceed 150 characters.");
      valid = false;
    }

    if (!normalizedSlug) {
      setSlugError("Tenant slug is required.");
      valid = false;
    } else if (normalizedSlug.length > 150) {
      setSlugError("Tenant slug cannot exceed 150 characters.");
      valid = false;
    } else if (!SLUG_REGEX.test(normalizedSlug)) {
      setSlugError(
        "Use lowercase English letters, numbers, and single hyphens only.",
      );
      valid = false;
    }

    if (!TENANT_TYPES.some((item) => item.value === type)) {
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload: CreateTenantRequest = {
      name: name.trim(),
      slug: slug.trim(),
      type,
    };

    await onSubmit(payload);
  }

  return (
    <Card className="w-full max-w-xl p-8">
      <div className="mb-7 space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">
          Create a Tenant
        </h1>

        <p className="text-sm text-text-secondary">
          Register your business or organization on Petoman.
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Tenant name"
          type="text"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="e.g. Happy Market"
          error={nameError ?? undefined}
          maxLength={150}
          aria-required="true"
        />

        <div className="flex w-full flex-col gap-2">
          <label
            htmlFor="tenant-type"
            className="text-sm font-medium text-text-primary"
          >
            Tenant type
          </label>

          <select
            id="tenant-type"
            value={type}
            onChange={(event) => setType(event.target.value as TenantType)}
            className="
              h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              px-3
              text-sm
              text-text-primary
              outline-none
              transition
              focus:border-primary
              focus:ring-2
              focus:ring-primary/30
            "
            aria-required="true"
          >
            {TENANT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Tenant slug"
          type="text"
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
          placeholder="e.g. happy-market"
          helperText="Your tenant URL identifier. Use lowercase English letters, numbers, and hyphens."
          error={slugError ?? undefined}
          maxLength={150}
          aria-required="true"
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Tenant
        </Button>
      </form>
    </Card>
  );
}
