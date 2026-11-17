import { useCallback, useEffect, useRef, useState } from "react";

import { homeService } from "../services";

import type {
  HomeProduct,
  HomeProductTenant,
  HomeProductsPagination,
} from "../types/home-products.types";

interface UseHomeProductsReturn {
  products: HomeProduct[];
  tenants: HomeProductTenant[];
  pagination: HomeProductsPagination | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useHomeProducts(): UseHomeProductsReturn {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [tenants, setTenants] = useState<HomeProductTenant[]>([]);
  const [pagination, setPagination] =
    useState<HomeProductsPagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setPagination(null);
    loadingMoreRef.current = false;
    setLoadingMore(false);

    try {
      const response = await homeService.getHomeProducts();

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setProducts(response.data.products);
      setTenants(response.data.tenants);
      setPagination(response.pagination);
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError("Failed to load products.");
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadMore = useCallback(async (): Promise<void> => {
    const cursor = pagination?.next_cursor;

    if (
      !cursor ||
      !pagination.has_more ||
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
      const response = await homeService.getHomeProducts(cursor);

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

      setTenants((current) => {
        const existingIds = new Set(current.map((tenant) => tenant.id));
        const newTenants = response.data.tenants.filter(
          (tenant) => !existingIds.has(tenant.id),
        );

        return [...current, ...newTenants];
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
  }, [pagination, loading, error]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [refresh]);

  return {
    products,
    tenants,
    pagination,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
  };
}
