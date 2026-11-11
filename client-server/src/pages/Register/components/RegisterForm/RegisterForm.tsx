import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Input, Button, Alert, Card } from "@/components/common";

import type { RegisterUserRequest } from "@/features/auth";

import type { RegisterFormProps } from "./RegisterForm.types";

export function RegisterForm({ loading, error, onSubmit }: RegisterFormProps) {
  const [form, setForm] = useState<RegisterUserRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  function handleChange(field: keyof RegisterUserRequest, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstName = form.firstName?.trim();
    const lastName = form.lastName?.trim();

    const payload: RegisterUserRequest = {
      email: form.email.trim(),
      password: form.password,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    };

    await onSubmit(payload);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Create your account
          </h1>

          <p className="text-sm text-text-secondary">
            Register to get started with Petoman.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="First name"
            type="text"
            value={form.firstName ?? ""}
            onChange={(event) => handleChange("firstName", event.target.value)}
            placeholder="Your first name"
            autoComplete="given-name"
          />

          <Input
            label="Last name"
            type="text"
            value={form.lastName ?? ""}
            onChange={(event) => handleChange("lastName", event.target.value)}
            placeholder="Your last name"
            autoComplete="family-name"
          />

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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
