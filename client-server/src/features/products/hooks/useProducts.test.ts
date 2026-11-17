import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { productService } from "../services";

import { useProducts } from "./useProducts";

import type {
  Product,
  ProductListResponse,
} from "../types";

vi.mock("../services", () => ({
  productService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

const firstProduct: Product = {
  id: 1,
  tenant_id: "tenant-1",
  name: "Product One",
  description: "First product",
  price: 100000,
  stock: 10,
  is_active: true,
  created_at: "2026-11-17T10:00:00.000Z",
  updated_at: "2026-11-17T10:00:00.000Z",
};

const secondProduct: Product = {
  ...firstProduct,
  id: 2,
  name: "Product Two",
};

const thirdProduct: Product = {
  ...firstProduct,
  id: 3,
  name: "Product Three",
};

const firstPage: ProductListResponse = {
  data: {
    tenant_id: "tenant-1",
    products: [firstProduct, secondProduct],
  },
  pagination: {
    per_page: 2,
    has_more: true,
    next_cursor: "next-page",
    previous_cursor: null,
  },
};

const secondPage: ProductListResponse = {
  data: {
    tenant_id: "tenant-1",
    products: [secondProduct, thirdProduct],
  },
  pagination: {
    per_page: 2,
    has_more: false,
    next_cursor: null,
    previous_cursor: "previous-page",
  },
};

describe("useProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getProducts).mockResolvedValue(firstPage);
  });

  it("loads products on mount", async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productService.getProducts).toHaveBeenCalledTimes(1);
    expect(result.current.products).toEqual(firstPage.data.products);
    expect(result.current.pagination).toEqual(firstPage.pagination);
    expect(result.current.error).toBeNull();
  });

  it("exposes an error when loading products fails", async () => {
    vi.mocked(productService.getProducts).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.error).toBe("Failed to load products.");
  });

  it("refreshes the products list", async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(result.current.products).toEqual(firstPage.data.products);
  });

  it("loads the next page and removes duplicate products", async () => {
    vi.mocked(productService.getProducts)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(productService.getProducts).toHaveBeenNthCalledWith(2, {
      cursor: "next-page",
    });

    expect(result.current.products).toEqual([
      firstProduct,
      secondProduct,
      thirdProduct,
    ]);
    expect(result.current.pagination).toEqual(secondPage.pagination);
    expect(result.current.loadingMore).toBe(false);
  });

  it("does not load another page when no next cursor exists", async () => {
    vi.mocked(productService.getProducts).mockResolvedValue({
      data: {
        tenant_id: "tenant-1",
        products: [firstProduct],
      },
      pagination: {
        per_page: 20,
        has_more: false,
        next_cursor: null,
        previous_cursor: null,
      },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(productService.getProducts).toHaveBeenCalledTimes(1);
  });

  it("exposes an error when loading the next page fails", async () => {
    vi.mocked(productService.getProducts)
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.products).toEqual(firstPage.data.products);
    expect(result.current.error).toBe("Failed to load more products.");
    expect(result.current.loadingMore).toBe(false);
  });

  it("creates a product and refreshes the list", async () => {
    vi.mocked(productService.createProduct).mockResolvedValue(thirdProduct);

    const payload = {
      name: "Product Three",
      price: 200000,
      stock: 5,
    };

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdProduct: Product | undefined;

    await act(async () => {
      createdProduct = await result.current.create(payload);
    });

    expect(productService.createProduct).toHaveBeenCalledWith(payload);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(createdProduct).toEqual(thirdProduct);
    expect(result.current.creating).toBe(false);
  });

  it("exposes an error when creating a product fails", async () => {
    vi.mocked(productService.createProduct).mockRejectedValue(
      new Error("Request failed"),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.create({
          name: "New Product",
          price: 100000,
        }),
      ).rejects.toThrow("Failed to create product.");
    });

    expect(result.current.error).toBe("Failed to create product.");
    expect(result.current.creating).toBe(false);
  });

  it("updates a product in the current list", async () => {
    const updatedProduct: Product = {
      ...firstProduct,
      name: "Updated Product",
      price: 150000,
    };

    vi.mocked(productService.updateProduct).mockResolvedValue(updatedProduct);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.update(1, {
        name: "Updated Product",
        price: 150000,
      });
    });

    expect(productService.updateProduct).toHaveBeenCalledWith(1, {
      name: "Updated Product",
      price: 150000,
    });
    expect(result.current.products[0]).toEqual(updatedProduct);
    expect(result.current.actionProductId).toBeNull();
  });

  it("exposes an error when updating a product fails", async () => {
    vi.mocked(productService.updateProduct).mockRejectedValue(
      new Error("Request failed"),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.update(1, { name: "Updated Product" }),
      ).rejects.toThrow("Failed to update product.");
    });

    expect(result.current.error).toBe("Failed to update product.");
    expect(result.current.actionProductId).toBeNull();
  });

  it("deletes a product and refreshes the list", async () => {
    vi.mocked(productService.deleteProduct).mockResolvedValue({
      tenant_id: "tenant-1",
      product_id: 1,
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(productService.deleteProduct).toHaveBeenCalledWith(1);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(result.current.actionProductId).toBeNull();
  });

  it("exposes an error when deleting a product fails", async () => {
    vi.mocked(productService.deleteProduct).mockRejectedValue(
      new Error("Request failed"),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.remove(1)).rejects.toThrow(
        "Failed to delete product.",
      );
    });

    expect(result.current.error).toBe("Failed to delete product.");
    expect(result.current.actionProductId).toBeNull();
  });
});
