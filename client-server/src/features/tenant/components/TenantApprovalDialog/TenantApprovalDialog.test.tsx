import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TenantApprovalDialog } from "./TenantApprovalDialog";

describe("TenantApprovalDialog", () => {
  const defaultProps = {
    open: true,
    tenantName: "Ali Market",
    loading: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("does not render when closed", () => {
    render(
      <TenantApprovalDialog
        {...defaultProps}
        open={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders tenant name and confirmation message", () => {
    render(<TenantApprovalDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Approve Tenant" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ali Market")).toBeInTheDocument();
  });

  it("calls onConfirm when confirmation button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <TenantApprovalDialog
        {...defaultProps}
        onConfirm={onConfirm}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm Approval" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <TenantApprovalDialog
        {...defaultProps}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables buttons while approval is loading", () => {
    render(
      <TenantApprovalDialog
        {...defaultProps}
        loading
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Approving..." }),
    ).toBeDisabled();
  });

  it("does not close when clicking backdrop while loading", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { container } = render(
      <TenantApprovalDialog
        {...defaultProps}
        loading
        onCancel={onCancel}
      />,
    );

    await user.click(container.firstElementChild!);

    expect(onCancel).not.toHaveBeenCalled();
  });
});