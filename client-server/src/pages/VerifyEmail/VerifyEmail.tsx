import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useSearchParams } from "react-router-dom";

import { authService } from "@/features/auth/services";
import { Alert, Button, Card, Loading } from "@/components/common";
import type { ApiErrorResponse } from "@/lib/api/api-response.types";

type VerificationStatus =
  | "loading"
  | "success"
  | "invalid"
  | "expired"
  | "error";

interface VerificationRequest {
  key: string;
  promise: Promise<{ verified: boolean }>;
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const requestRef = useRef<VerificationRequest | null>(null);

  const [retryAttempt, setRetryAttempt] = useState(0);

  const [status, setStatus] = useState<VerificationStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");

    const requestKey = `${token}:${retryAttempt}`;

    let request = requestRef.current;

    if (!request || request.key !== requestKey) {
      request = {
        key: requestKey,
        promise: authService.verifyEmail({ token }),
      };

      requestRef.current = request;
    }

    request.promise
      .then((result) => {
        if (cancelled) {
          return;
        }

        setStatus(result.verified ? "success" : "invalid");
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        const code = isAxiosError<ApiErrorResponse>(error)
          ? error.response?.data?.error?.code
          : undefined;

        const statusCode = isAxiosError(error)
          ? error.response?.status
          : undefined;

        if (code === "EMAIL_VERIFICATION_TOKEN_EXPIRED") {
          setStatus("expired");
          return;
        }

        if (
          code === "EMAIL_VERIFICATION_TOKEN_INVALID" ||
          code === "EMAIL_VERIFICATION_TOKEN_USED" ||
          code === "AUTH_BAD_REQUEST" ||
          statusCode === 400
        ) {
          setStatus("invalid");
          return;
        }

        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token, retryAttempt]);

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Email Verification
          </h1>

          <p className="text-sm text-text-secondary">
            Verify your email address to activate your account.
          </p>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loading text="Verifying your email address..." />
          </div>
        )}

        {status === "success" && (
          <div className="space-y-5">
            <Alert variant="success" title="Email verified">
              Your email address has been successfully verified. You can now
              sign in to your account.
            </Alert>

            <Link to="/login" className="block">
              <Button className="w-full">Continue to sign in</Button>
            </Link>
          </div>
        )}

        {status === "expired" && (
          <div className="space-y-5">
            <Alert variant="warning" title="Link expired">
              This verification link has expired. Request a new verification
              email to continue.
            </Alert>

            <Link to="/resend-verification" className="block">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-5">
            <Alert variant="error" title="Verification unsuccessful">
              This verification link is invalid, expired, or has already been
              used. You can request a new verification email to continue.
            </Alert>

            <Link to="/resend-verification" className="block">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5">
            <Alert variant="error" title="Verification failed">
              We could not verify your email address. Please try again later.
            </Alert>

            <Button
              className="w-full"
              onClick={() => setRetryAttempt((previous) => previous + 1)}
            >
              Try again
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
