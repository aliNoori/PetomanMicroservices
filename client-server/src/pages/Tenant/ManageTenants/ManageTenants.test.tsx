import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen, within } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { ManageTenants } from "./ManageTenants";

import { usePendingTenants } from "@/features/tenant";

import type { PendingTenant } from "@/features/tenant";

vi.mock("@/features/tenant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/tenant")>();

  return {
    ...actual,
    usePendingTenants: vi.fn(),
  };
});

function createTenant(overrides: Partial<PendingTenant> = {}): PendingTenant {
  return {
    id: "tenant-1",
    name: "AliMarket",
    slug: "alimarket",
    ownerId: "user-1",
    status: "PENDING",
    createdAt: "2026-11-10T10:00:00.000Z",
    ...overrides,
  };
}

function createPendingTenantsContext(
  overrides: Partial<ReturnType<typeof usePendingTenants>> = {},
) {
  return {
    tenants: [createTenant()],
    total: 1,
    loading: false,
    error: null,
    actionTenantId: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    approve: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderManageTenants() {
  return render(<ManageTenants />);
}

describe("ManageTenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePendingTenants).mockReturnValue(createPendingTenantsContext());
  });

  it("renders the page title and pending tenant count", () => {
    renderManageTenants();

    expect(
      screen.getByRole("heading", {
        name: /pending tenant management/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/pending requests: 1/i)).toBeInTheDocument();
  });

  it("renders pending tenants", () => {
    renderManageTenants();

    expect(screen.getByText("Slug: alimarket")).toBeInTheDocument();
    expect(screen.getByText("Slug: alimarket")).toBeInTheDocument();
  });

  it("opens the approval dialog", async () => {
    const user = userEvent.setup();

    renderManageTenants();

    await user.click(
      screen.getByRole("button", {
        name: /approve/i,
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("AliMarket")).toBeInTheDocument();
  });

  it("approves a tenant and closes the dialog", async () => {
    const user = userEvent.setup();

    const approve = vi.fn().mockResolvedValue(undefined);

    vi.mocked(usePendingTenants).mockReturnValue(
      createPendingTenantsContext({ approve }),
    );

    renderManageTenants();

    await user.click(
      screen.getByRole("button", {
        name: /approve/i,
      }),
    );

    const dialog = screen.getByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /confirm approval/i,
      }),
    );

    expect(approve).toHaveBeenCalledWith("tenant-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the rejection dialog", async () => {
    const user = userEvent.setup();

    renderManageTenants();

    await user.click(
      screen.getByRole("button", {
        name: /reject/i,
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("rejects a tenant with a reason and closes the dialog", async () => {
    const user = userEvent.setup();

    const reject = vi.fn().mockResolvedValue(undefined);

    vi.mocked(usePendingTenants).mockReturnValue(
      createPendingTenantsContext({ reject }),
    );

    renderManageTenants();

    await user.click(
      screen.getByRole("button", {
        name: /reject/i,
      }),
    );

    const dialog = screen.getByRole("dialog");

    await user.type(
      within(dialog).getByRole("textbox"),
      "Invalid tenant information",
    );

    await user.click(
      within(dialog).getByRole("button", {
        name: /reject/i,
      }),
    );

    expect(reject).toHaveBeenCalledWith("tenant-1", {
      reason: "Invalid tenant information",
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays an error when loading tenants fails", () => {
    vi.mocked(usePendingTenants).mockReturnValue(
      createPendingTenantsContext({
        tenants: [],
        total: 0,
        error: "Failed to load pending tenants.",
      }),
    );

    renderManageTenants();

    expect(
      screen.getByText("Failed to load pending tenants."),
    ).toBeInTheDocument();
  });
});
