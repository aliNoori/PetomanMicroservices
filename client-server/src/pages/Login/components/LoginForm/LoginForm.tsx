import { useState, type FormEvent } from "react";

import { Input, Button, Alert, Card } from "@/components/common";

import type { LoginRequest } from "@/features/auth";

import type { LoginFormProps } from "./LoginForm.types";

import { Link } from "react-router-dom";

export function LoginForm({ loading, error, onSubmit }: LoginFormProps) {
  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  function handleChange(field: keyof LoginRequest, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit(form);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">Welcome back</h1>

          <p className="text-sm text-text-secondary">
            Sign in to continue to your account.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}
