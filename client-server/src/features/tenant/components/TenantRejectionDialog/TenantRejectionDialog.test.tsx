import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TenantRejectionDialog } from "./TenantRejectionDialog";

describe("TenantRejectionDialog", () => {
  const defaultProps = {
    open: true,
    tenantName: "Ali Market",
    loading: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("does not render when closed", () => {
    render(
      <TenantRejectionDialog
        {...defaultProps}
        open={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders tenant name and rejection form", () => {
    render(<TenantRejectionDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reject Tenant" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ali Market")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rejection reason"),
    ).toBeInTheDocument();
  });

  it("keeps submit disabled when reason is shorter than 5 characters", async () => {
    const user = userEvent.setup();

    render(<TenantRejectionDialog {...defaultProps} />);

    const textarea = screen.getByLabelText("Rejection reason");
    const submitButton = screen.getByRole("button", {
      name: "Confirm Rejection",
    });

    await user.type(textarea, "bad");

    expect(submitButton).toBeDisabled();
  });

  it("submits trimmed rejection reason", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <TenantRejectionDialog
        {...defaultProps}
        onConfirm={onConfirm}
      />,
    );

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "  Invalid tenant information  ",
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm Rejection" }),
    );

    expect(onConfirm).toHaveBeenCalledWith(
      "Invalid tenant information",
    );
  });

  it("does not submit a whitespace-only reason", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <TenantRejectionDialog
        {...defaultProps}
        onConfirm={onConfirm}
      />,
    );

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "     ",
    );

    expect(
      screen.getByRole("button", { name: "Confirm Rejection" }),
    ).toBeDisabled();

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <TenantRejectionDialog
        {...defaultProps}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables form actions while loading", () => {
    render(
      <TenantRejectionDialog
        {...defaultProps}
        loading
      />,
    );

    expect(screen.getByLabelText("Rejection reason")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Rejecting..." }),
    ).toBeDisabled();
  });

  it("resets reason when reopened for another tenant", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TenantRejectionDialog {...defaultProps} />,
    );

    const textarea = screen.getByLabelText("Rejection reason");

    await user.type(textarea, "Invalid information");

    rerender(
      <TenantRejectionDialog
        {...defaultProps}
        open={false}
      />,
    );

    rerender(
      <TenantRejectionDialog
        {...defaultProps}
        tenantName="Ali Pharmacy"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Rejection reason")).toHaveValue("");
    });
  });
});