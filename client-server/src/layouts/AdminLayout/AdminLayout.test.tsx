import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AdminLayout } from "./AdminLayout";

vi.mock("@/components", () => ({
  ThemeToggle: () => <button type="button">Theme toggle</button>,
}));

vi.mock("@/layouts/AppLayout/components/Header/UserMenu", () => ({
  UserMenu: () => <div>User menu</div>,
}));

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={["/admin/tenants/pending"]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            path="tenants/pending"
            element={<h2>Pending Tenants Content</h2>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("renders the administration header and navigation", () => {
    renderAdminLayout();

    expect(
      screen.getByRole("heading", {
        name: "Platform Administration",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", {
        name: "Admin navigation",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Pending Tenants",
      }),
    ).toBeInTheDocument();
  });

  it("renders nested route content through Outlet", () => {
    renderAdminLayout();

    expect(
      screen.getByRole("heading", {
        name: "Pending Tenants Content",
      }),
    ).toBeInTheDocument();
  });

  it("opens the mobile navigation", async () => {
    const user = userEvent.setup();

    renderAdminLayout();

    await user.click(
      screen.getByRole("button", {
        name: "Open navigation",
      }),
    );

    expect(
      screen.getByRole("navigation", {
        name: "Admin mobile navigation",
      }),
    ).toBeInTheDocument();
  });

  it("closes the mobile navigation using the close button", async () => {
    const user = userEvent.setup();

    renderAdminLayout();

    await user.click(
      screen.getByRole("button", {
        name: "Open navigation",
      }),
    );

    const closeButtons = screen.getAllByRole("button", {
      name: "Close navigation",
    });

    await user.click(closeButtons[1]);

    expect(
      screen.queryByRole("navigation", {
        name: "Admin mobile navigation",
      }),
    ).not.toBeInTheDocument();
  });
});