import { useState, type FormEvent } from "react";

import { Alert, Button, Input } from "@/components/common";

import type {
  ChangePasswordFormData,
  ChangePasswordFormProps,
} from "./ChangePasswordForm.types";

/**
 * Change password form.
 *
 * Performs client-side validation before delegating
 * submission to the page layer.
 */
export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const [form, setForm] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  function updateField(field: keyof ChangePasswordFormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validate(): string | null {
    if (!form.currentPassword) {
      return "Current password is required.";
    }

    if (form.newPassword.length < 8) {
      return "New password must be at least 8 characters.";
    }

    if (form.newPassword !== form.confirmPassword) {
      return "New password and confirmation do not match.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);

      return;
    }

    setError(null);

    setLoading(true);

    try {
      await onSubmit(form);

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      // Submission errors are handled by the parent/page layer.
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Current Password"
        type="password"
        value={form.currentPassword}
        onChange={(event) => updateField("currentPassword", event.target.value)}
        autoComplete="current-password"
        required
      />

      <Input
        label="New Password"
        type="password"
        value={form.newPassword}
        onChange={(event) => updateField("newPassword", event.target.value)}
        autoComplete="new-password"
        required
      />

      <Input
        label="Confirm New Password"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        autoComplete="new-password"
        required
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
