import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Card } from "@/components/common";
import { useAuth } from "@/features/auth";

import { ChangePasswordForm } from "./components";
import type { ChangePasswordFormData } from "./components";

/**
 * Change password page.
 *
 * Owns user-facing success and error feedback
 * while authentication logic remains inside
 * the auth feature.
 */
export function ChangePasswordPage() {
  const { changePassword } = useAuth();

  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(data: ChangePasswordFormData): Promise<void> {
    setErrorMessage(null);

    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Your password has been changed successfully. Please sign in with your new password.",
        },
      });
    } catch {
      setErrorMessage(
        "Unable to change your password. Please verify your current password and try again.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Change Password
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          Update your account password to keep your account secure.
        </p>

        {errorMessage && (
          <div className="mt-6">
            <Alert variant="error">{errorMessage}</Alert>
          </div>
        )}

        <div className="mt-8">
          <ChangePasswordForm onSubmit={handleSubmit} />
        </div>
      </Card>
    </div>
  );
}
