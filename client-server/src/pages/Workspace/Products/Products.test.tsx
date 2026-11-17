import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductsPage } from "./Products";
import { useAuth } from "@/features/auth";
import { useProducts } from "@/features/products";

import type { Product } from "@/features/products";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/products", () => ({
  useProducts: vi.fn(),
}));

const mockProduct: Product = {
  id: 1,
  tenant_id: "tenant-1",
  name: "Test Product",
  description: "A sample product description",
  price: 150000,
  stock: 25,
  is_active: true,
  created_at: "2026-11-17T10:00:00.000Z",
  updated_at: "2026-11-17T10:00:00.000Z",
};

const mockSecondProduct: Product = {
  ...mockProduct,
  id: 2,
  name: "Inactive Product",
  description: null,
  price: 250000,
  stock: 0,
  is_active: false,
};

function createAuthContext(
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) {
  return {
    user: null,
    tenants: [],
    selectedTenant: {
      id: "tenant-1",
      name: "Test Store",
      slug: "test-store",
      type: "markets",
    },
    roles: [],
    permissions: [
      "product.read",
      "product.create",
      "product.update",
      "product.delete",
    ],
    sessionActive: true,
    loading: false,
    authenticated: true,
    login: vi.fn(),
    selectTenant: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    changePassword: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>;
}

function createHookResult(
  overrides: Partial<ReturnType<typeof useProducts>> = {},
) {
  return {
    products: [mockProduct],
    pagination: {
      per_page: 20,
      has_more: false,
      next_cursor: null,
      previous_cursor: null,
    },
    loading: false,
    loadingMore: false,
    creating: false,
    error: null,
    actionProductId: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    loadMore: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(mockProduct),
    update: vi.fn().mockResolvedValue(mockProduct),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as ReturnType<typeof useProducts>;
}

function renderProducts() {
  return render(<ProductsPage />);
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue(createAuthContext());
    vi.mocked(useProducts).mockReturnValue(createHookResult());
  });

  it("should render the page and workspace information", () => {
    renderProducts();

    expect(
      screen.getByRole("heading", { name: "Products" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Store")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("A sample product description")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    expect(useProducts).toHaveBeenCalledWith(true);
  });

  it("should display product price and stock", () => {
    renderProducts();

    expect(
      screen.getByText(
        new Intl.NumberFormat(undefined, {
          maximumFractionDigits: 0,
        }).format(mockProduct.price),
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(mockProduct.stock))).toBeInTheDocument();
  });

  it("should display loading state", () => {
    vi.mocked(useProducts).mockReturnValue(
      createHookResult({
        products: [],
        loading: true,
      }),
    );

    renderProducts();

    expect(
      screen.getByText("Loading workspace products..."),
    ).toBeInTheDocument();
  });

  it("should display empty state when there are no products", () => {
    vi.mocked(useProducts).mockReturnValue(
      createHookResult({
        products: [],
      }),
    );

    renderProducts();

    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create your first product" }),
    ).toBeInTheDocument();
  });

  it("should display an error and allow retry", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({
        products: [],
        error: "Failed to load products.",
        refresh,
      }),
    );

    renderProducts();

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("should refresh products when refresh button is clicked", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({ refresh }),
    );

    renderProducts();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("should hide product data and actions without read permission", () => {
    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        permissions: ["product.create"],
      }),
    );

    renderProducts();

    expect(screen.getByText("Access restricted")).toBeInTheDocument();
    expect(screen.queryByText("Test Product")).not.toBeInTheDocument();
    expect(useProducts).toHaveBeenCalledWith(false);
    expect(
      screen.queryByRole("button", { name: "Create product" }),
    ).not.toBeInTheDocument();
  });

  it("should hide create action without create permission", () => {
    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        permissions: ["product.read"],
      }),
    );

    renderProducts();

    expect(
      screen.queryByRole("button", { name: "Create product" }),
    ).not.toBeInTheDocument();
  });

  it("should hide edit and delete actions without their permissions", () => {
    vi.mocked(useAuth).mockReturnValue(
      createAuthContext({
        permissions: ["product.read"],
      }),
    );

    renderProducts();

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("should create a product", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(mockProduct);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({ create }),
    );

    renderProducts();

    await user.click(
      screen.getByRole("button", { name: "Create product" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Create product" });
    expect(dialog).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText("Product name"),
      "New Product",
    );

    await user.clear(within(dialog).getByLabelText("Price"));
    await user.type(within(dialog).getByLabelText("Price"), "200000");

    await user.clear(within(dialog).getByLabelText("Stock"));
    await user.type(within(dialog).getByLabelText("Stock"), "10");

    await user.click(
      within(dialog).getByRole("button", { name: "Create product" }),
    );

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        name: "New Product",
        description: null,
        price: 200000,
        stock: 10,
        is_active: true,
      });
    });

    expect(
      await screen.findByText("Product created successfully."),
    ).toBeInTheDocument();
  });

  it("should update an existing product", async () => {
    const user = userEvent.setup();
    const update = vi.fn().mockResolvedValue(mockProduct);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({ update }),
    );

    renderProducts();

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(
      screen.getByRole("dialog", { name: "Edit product" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText("Product name");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Product");

    await user.click(
      screen.getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        mockProduct.id,
        expect.objectContaining({
          name: "Updated Product",
          price: mockProduct.price,
          stock: mockProduct.stock,
          is_active: true,
        }),
      );
    });

    expect(
      await screen.findByText("Product updated successfully."),
    ).toBeInTheDocument();
  });

  it("should delete a product after confirmation", async () => {
    const user = userEvent.setup();
    const remove = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({ remove }),
    );

    renderProducts();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      screen.getByRole("alertdialog", { name: "Delete product" }),
    ).toBeInTheDocument();

    expect(within(screen.getByRole("alertdialog")).getByText("Test Product")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete product" }),
    );

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith(mockProduct.id);
    });

    expect(
      await screen.findByText("Product deleted successfully."),
    ).toBeInTheDocument();
  });

  it("should display delete error when deletion fails", async () => {
    const user = userEvent.setup();
    const remove = vi.fn().mockRejectedValue(new Error("Delete failed"));

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({ remove }),
    );

    renderProducts();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await user.click(
      screen.getByRole("button", { name: "Delete product" }),
    );

    expect(
      await screen.findByText(
        "Unable to delete the product. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("should load more products when more pages are available", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useProducts).mockReturnValue(
      createHookResult({
        pagination: {
          per_page: 20,
          has_more: true,
          next_cursor: "next-cursor",
          previous_cursor: null,
        },
        loadMore,
      }),
    );

    renderProducts();

    await user.click(
      screen.getByRole("button", { name: "Load more products" }),
    );

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("should display inactive product status", () => {
    vi.mocked(useProducts).mockReturnValue(
      createHookResult({
        products: [mockSecondProduct],
      }),
    );

    renderProducts();

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Inactive Product")).toBeInTheDocument();
  });
});