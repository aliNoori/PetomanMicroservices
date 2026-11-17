
import { useCallback, useEffect, useRef, useState } from "react";

import { productService } from "../services";

import type {
  Product,
  ProductPagination,
  CreateProductRequest,
  UpdateProductRequest,
} from "../types";

interface UseProductsReturn {
  products: Product[];
  pagination: ProductPagination | null;
  loading: boolean;
  loadingMore: boolean;
  creating: boolean;
  error: string | null;
  actionProductId: number | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  create: (payload: CreateProductRequest) => Promise<Product>;
  update: (
    productId: number,
    payload: UpdateProductRequest,
  ) => Promise<Product>;
  remove: (productId: number) => Promise<void>;
}

export function useProducts(enabled = true): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] =
    useState<ProductPagination | null>(null);

  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionProductId, setActionProductId] = useState<number | null>(null);

  const mountedRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setPagination(null);

    loadingMoreRef.current = false;
    setLoadingMore(false);

    try {
      const response = await productService.getProducts();

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setProducts(response.data.products);
      setPagination(response.pagination);
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setProducts([]);
        setPagination(null);
        setError("Failed to load products.");
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  const loadMore = useCallback(async (): Promise<void> => {
    const cursor = pagination?.next_cursor;

    if (
      !enabled ||
      !cursor ||
      !pagination?.has_more ||
      loadingMoreRef.current ||
      loading ||
      error
    ) {
      return;
    }

    const requestId = requestIdRef.current;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const response = await productService.getProducts({ cursor });

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setProducts((current) => {
        const existingIds = new Set(current.map((product) => product.id));

        const newProducts = response.data.products.filter(
          (product) => !existingIds.has(product.id),
        );

        return [...current, ...newProducts];
      });

      setPagination(response.pagination);
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError("Failed to load more products.");
      }
    } finally {
      loadingMoreRef.current = false;

      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [enabled, pagination, loading, error]);

  const create = useCallback(
    async (payload: CreateProductRequest): Promise<Product> => {
      if (mountedRef.current) {
        setCreating(true);
        setError(null);
      }

      try {
        const product = await productService.createProduct(payload);

        if (mountedRef.current) {
          await refresh();
        }

        return product;
      } catch {
        if (mountedRef.current) {
          setError("Failed to create product.");
        }

        throw new Error("Failed to create product.");
      } finally {
        if (mountedRef.current) {
          setCreating(false);
        }
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (
      productId: number,
      payload: UpdateProductRequest,
    ): Promise<Product> => {
      if (mountedRef.current) {
        setActionProductId(productId);
        setError(null);
      }

      try {
        const product = await productService.updateProduct(
          productId,
          payload,
        );

        if (mountedRef.current) {
          setProducts((current) =>
            current.map((item) => (item.id === productId ? product : item)),
          );
        }

        return product;
      } catch {
        if (mountedRef.current) {
          setError("Failed to update product.");
        }

        throw new Error("Failed to update product.");
      } finally {
        if (mountedRef.current) {
          setActionProductId(null);
        }
      }
    },
    [],
  );

  const remove = useCallback(
    async (productId: number): Promise<void> => {
      if (mountedRef.current) {
        setActionProductId(productId);
        setError(null);
      }

      try {
        await productService.deleteProduct(productId);

        if (mountedRef.current) {
          await refresh();
        }
      } catch {
        if (mountedRef.current) {
          setError("Failed to delete product.");
        }

        throw new Error("Failed to delete product.");
      } finally {
        if (mountedRef.current) {
          setActionProductId(null);
        }
      }
    },
    [refresh],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      void refresh();
    } else {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [enabled, refresh]);

  return {
    products,
    pagination,
    loading,
    loadingMore,
    creating,
    error,
    actionProductId,
    refresh,
    loadMore,
    create,
    update,
    remove,
  };
}
