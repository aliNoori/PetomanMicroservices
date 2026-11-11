import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { RegisterPage } from "./Register";
import { authService } from "@/features/auth/services";

vi.mock("@/features/auth/services", () => ({
  authService: {
    register: vi.fn(),
    resendVerificationEmail: vi.fn(),
  },
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

function createApiError(code: string, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: {
      data: {
        success: false,
        error: {
          code,
          message,
        },
      },
    },
  });
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("registers successfully and shows the email verification message", async () => {
    const user = userEvent.setup();

    vi.mocked(authService.register).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      firstName: "Ali",
      lastName: "Noori",
      isActive: true,
      isEmailVerified: false,
      tenantMemberships: [],
    });

    renderRegister();

    await user.type(screen.getByLabelText(/first name/i), "Ali");
    await user.type(screen.getByLabelText(/last name/i), "Noori");
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(authService.register).toHaveBeenCalledWith({
      firstName: "Ali",
      lastName: "Noori",
      email: "user@example.com",
      password: "password123",
    });

    expect(
      await screen.findByRole("heading", { name: /check your email/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(/the link expires after 30 minutes/i),
    ).toBeInTheDocument();
  });

  it("shows an error when the email already exists", async () => {
    const user = userEvent.setup();

    vi.mocked(authService.register).mockRejectedValue(
      createApiError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists.",
      ),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/an account with this email already exists/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows the resend option when email delivery fails after account creation", async () => {
    const user = userEvent.setup();

    vi.mocked(authService.register).mockRejectedValue(
      createApiError(
        "EMAIL_DELIVERY_FAILED",
        "Verification email delivery failed.",
      ),
    );

    renderRegister();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: /your account has been created/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /resend verification email/i,
      }),
    ).toBeInTheDocument();
  });

  it("resends the verification email", async () => {
    const user = userEvent.setup();

    vi.mocked(authService.register).mockRejectedValue(
      createApiError(
        "EMAIL_DELIVERY_FAILED",
        "Verification email delivery failed.",
      ),
    );

    vi.mocked(authService.resendVerificationEmail).mockResolvedValue(undefined);

    renderRegister();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: /resend verification email/i,
      }),
    );

    expect(authService.resendVerificationEmail).toHaveBeenCalledWith({
      email: "user@example.com",
    });

    expect(
      await screen.findByRole("heading", { name: /check your email/i }),
    ).toBeInTheDocument();
  });
});