import { useState } from "react";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";

import { Button, Card } from "@/components/common";
import { authService } from "@/features/auth/services";

import type { RegisterUserRequest } from "@/features/auth";
import type { ApiErrorResponse } from "@/lib/api/api-response.types";

import { RegisterForm } from "./components";

type RegistrationStatus = "idle" | "success" | "delivery-failed";

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<RegistrationStatus>("idle");

  async function handleRegister(payload: RegisterUserRequest, avatar?: File) {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(payload, avatar);

      setEmail(response.email);
      setStatus("success");
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err)) {
        const code = err.response?.data?.error?.code;

        if (code === "EMAIL_ALREADY_EXISTS") {
          setError(
            "An account with this email already exists. Please sign in or use another email address.",
          );
        } else if (code === "EMAIL_DELIVERY_FAILED") {
          setEmail(payload.email.trim().toLowerCase());
          setStatus("delivery-failed");
        } else {
          setError(
            err.response?.data?.error?.message ??
              "Unable to create your account. Please try again.",
          );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    setError(null);

    try {
      await authService.resendVerificationEmail({ email });
      setStatus("success");
    } catch {
      setError(
        "Unable to request another verification email. Please try again later.",
      );
    } finally {
      setResending(false);
    }
  }

  if (status !== "idle") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-5 text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              {status === "success"
                ? "Check your email"
                : "Your account has been created"}
            </h1>

            <p className="text-sm text-text-secondary">
              {status === "success"
                ? "We have sent a verification link to:"
                : "Your account was created, but we could not send the verification email."}
            </p>

            <p className="break-all font-medium text-text-primary">{email}</p>

            {status === "success" ? (
              <p className="text-sm text-text-secondary">
                Please open the email and follow the verification link. The link
                expires after 30 minutes.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  You can request another verification email.
                </p>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="button"
                  className="w-full"
                  disabled={resending}
                  onClick={handleResendVerification}
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </Button>
              </div>
            )}

            <p className="text-sm text-text-secondary">
              Already verified?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <RegisterForm loading={loading} error={error} onSubmit={handleRegister} />
  );
}
