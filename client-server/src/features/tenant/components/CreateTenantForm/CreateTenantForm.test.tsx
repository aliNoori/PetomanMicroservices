import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CreateTenantForm } from "./CreateTenantForm";

describe("CreateTenantForm", () => {
  it("renders tenant name and slug fields", () => {
    render(
      <CreateTenantForm
        loading={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
  });

  it("generates slug from tenant name", async () => {
    const user = userEvent.setup();

    render(
      <CreateTenantForm
        loading={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/tenant name/i), "My New Tenant");

    expect(screen.getByLabelText(/slug/i)).toHaveValue("my-new-tenant");
  });

  it("submits valid tenant data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <CreateTenantForm
      loading={false}
      error={null}
      onSubmit={onSubmit}
    />,
  );

  await user.type(
    screen.getByLabelText(/tenant name/i),
    "My Tenant",
  );

  await user.click(
    screen.getByRole("button", { name: /create tenant/i }),
  );

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: "My Tenant",
      slug: "my-tenant",
      type: "markets",
    });
  });
});

  it("does not submit when tenant name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CreateTenantForm
        loading={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/slug/i), "my-tenant");

    await user.click(
      screen.getByRole("button", { name: /create tenant/i }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/tenant name is required/i)).toBeInTheDocument();
  });

  it("does not submit an invalid slug", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CreateTenantForm
        loading={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/tenant name/i), "My Tenant");

    const slugInput = screen.getByLabelText(/slug/i);
    await user.clear(slugInput);
    await user.type(slugInput, "Invalid Slug!");

    await user.click(
      screen.getByRole("button", { name: /create tenant/i }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("displays the server error", () => {
    render(
      <CreateTenantForm
        loading={false}
        error="This tenant slug is already in use."
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("This tenant slug is already in use."),
    ).toBeInTheDocument();
  });

  it("disables submission while loading", () => {
    render(
      <CreateTenantForm
        loading
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /create tenant/i }),
    ).toBeDisabled();
  });
});