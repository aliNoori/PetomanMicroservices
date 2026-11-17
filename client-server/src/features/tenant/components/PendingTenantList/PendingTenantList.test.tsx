import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PendingTenantList } from "./PendingTenantList";

import type { PendingTenant } from "../../types";

const tenants: PendingTenant[] = [
  {
    id: "tenant-1",
    name: "Ali Market",
    slug: "ali-market",
    type: "markets",
    ownerId: "user-1",
    status: "PENDING",
    createdAt: "2026-11-10T10:00:00.000Z",
  },
  {
    id: "tenant-2",
    name: "Ali Pharmacy",
    slug: "ali-pharmacy",
    type: "pharmacies",
    ownerId: "user-2",
    status: "PENDING",
    createdAt: "2026-11-10T11:00:00.000Z",
  },
];

describe("PendingTenantList", () => {
  it("shows loading state", () => {
    render(
      <PendingTenantList
        tenants={[]}
        loading
        error={null}
        actionTenantId={null}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("shows error state", () => {
    render(
      <PendingTenantList
        tenants={[]}
        loading={false}
        error="Failed to load pending tenants."
        actionTenantId={null}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to load pending tenants.",
    );
  });

  it("shows empty state", () => {
    render(
      <PendingTenantList
        tenants={[]}
        loading={false}
        error={null}
        actionTenantId={null}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("No pending tenants found.")).toBeInTheDocument();
  });

  it("renders pending tenants", () => {
    render(
      <PendingTenantList
        tenants={tenants}
        loading={false}
        error={null}
        actionTenantId={null}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Ali Market")).toBeInTheDocument();
    expect(screen.getByText("Ali Pharmacy")).toBeInTheDocument();
    expect(screen.getByText("Slug: ali-market")).toBeInTheDocument();
  });

  it("calls onApprove with the selected tenant ID", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();

    render(
      <PendingTenantList
        tenants={tenants}
        loading={false}
        error={null}
        actionTenantId={null}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Approve" })[0]);

    expect(onApprove).toHaveBeenCalledWith("tenant-1");
  });

  it("calls onReject with the selected tenant", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();

    render(
      <PendingTenantList
        tenants={tenants}
        loading={false}
        error={null}
        actionTenantId={null}
        onApprove={vi.fn()}
        onReject={onReject}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Reject" })[0]);

    expect(onReject).toHaveBeenCalledWith(tenants[0]);
  });

  it("disables actions while a tenant is processing", () => {
    render(
      <PendingTenantList
        tenants={tenants}
        loading={false}
        error={null}
        actionTenantId="tenant-1"
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(4);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });
});