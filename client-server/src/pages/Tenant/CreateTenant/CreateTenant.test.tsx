import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { CreateTenantPage } from "./CreateTenant";
import { tenantService } from "@/features/tenant";

import type { CreateTenantResponse } from "@/features/tenant";

vi.mock("@/features/tenant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/tenant")>();

  return {
    ...actual,
    tenantService: {
      createTenant: vi.fn(),
    },
  };
});

const mockCreateTenant = vi.mocked(tenantService.createTenant);

const mockResponse: CreateTenantResponse = {
  tenant: {
    id: "tenant-123",
    name: "Happy Market",
    slug: "happy-market",
    ownerId: "user-123",
    status: "PENDING",
  },
  defaultRoles: {
    tenantAdmin: {
      id: "role-admin",
      slug: "tenant-admin",
    },
    staff: {
      id: "role-staff",
      slug: "staff",
    },
  },
  permissions: {
    tenantAdmin: ["TENANT_READ", "TENANT_UPDATE"],
    staff: ["TENANT_READ"],
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateTenantPage />
    </MemoryRouter>,
  );
}

describe("CreateTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the create tenant form", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: /create a tenant/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenant slug/i)).toBeInTheDocument();
  });

  it("creates a tenant and displays the result", async () => {
    const user = userEvent.setup();

    mockCreateTenant.mockResolvedValue(mockResponse);

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    await user.click(screen.getByRole("button", { name: /create tenant/i }));

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledWith({
        name: "Happy Market",
        slug: "happy-market",
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: "Happy Market",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("happy-market")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("tenant-123")).toBeInTheDocument();

    expect(screen.getByText(/waiting for approval/i)).toBeInTheDocument();
  });

  it("displays an error when tenant slug already exists", async () => {
    const user = userEvent.setup();

    mockCreateTenant.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          error: {
            code: "AUTH_TENANT_SLUG_ALREADY_EXISTS",
            message: "Slug already exists.",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    await user.click(screen.getByRole("button", { name: /create tenant/i }));

    expect(
      await screen.findByText(/this tenant slug is already in use/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
  });

  it("displays an error when the user account is inactive", async () => {
    const user = userEvent.setup();

    mockCreateTenant.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          error: {
            code: "AUTH_USER_INACTIVE",
            message: "User inactive.",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    await user.click(screen.getByRole("button", { name: /create tenant/i }));

    expect(
      await screen.findByText(/your account is inactive/i),
    ).toBeInTheDocument();
  });

  it("displays the API error message", async () => {
    const user = userEvent.setup();

    mockCreateTenant.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          error: {
            code: "AUTH_UNKNOWN_ERROR",
            message: "Something went wrong on the server.",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    await user.click(screen.getByRole("button", { name: /create tenant/i }));

    expect(
      await screen.findByText("Something went wrong on the server."),
    ).toBeInTheDocument();
  });

  it("displays an unexpected error for non-Axios failures", async () => {
    const user = userEvent.setup();

    mockCreateTenant.mockRejectedValue(new Error("Unexpected failure"));

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    await user.click(screen.getByRole("button", { name: /create tenant/i }));

    expect(
      await screen.findByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("shows loading state while the tenant creation request is pending", async () => {
    const user = userEvent.setup();

    let rejectRequest!: (reason?: unknown) => void;

    mockCreateTenant.mockReturnValue(
      new Promise<CreateTenantResponse>((_, reject) => {
        rejectRequest = reject;
      }),
    );

    renderPage();

    await user.type(screen.getByLabelText(/tenant name/i), "Happy Market");

    const submitButton = screen.getByRole("button", {
      name: /create tenant/i,
    });

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    rejectRequest(new Error("Request failed"));

    expect(
      await screen.findByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create tenant/i }),
    ).toBeEnabled();
  });
});
