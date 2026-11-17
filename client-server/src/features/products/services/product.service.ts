import { apiClient } from "@/lib/api/client";

import type {
  ApiResponse,
} from "@/lib/api/api-response.types";

import type {
  Product,
  ProductPagination,
  ProductListData,
  ProductDetailData,
  ProductListResponse,
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductResponse,
} from "../types";

interface ProductApiMeta {
  pagination?: ProductPagination | null;
}

interface ProductApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: ProductApiMeta;
}

export interface GetProductsParams {
  per_page?: number;
  cursor?: string;
}

class ProductService {
  async getProducts(
    params: GetProductsParams = {},
  ): Promise<ProductListResponse> {
    const response = await apiClient.getResponse<
      ProductApiEnvelope<ProductListData>
    >("/market/products", {
      params: {
        per_page: params.per_page ?? 20,
        ...(params.cursor ? { cursor: params.cursor } : {}),
      },
    });

    return {
      data: response.data.data,
      pagination: response.data.meta.pagination ?? null,
    };
  }

  async getProduct(productId: number): Promise<Product> {
    const response = await apiClient.getResponse<
      ProductApiEnvelope<ProductDetailData>
    >(`/market/products/${productId}`);

    return response.data.data.product;
  }

  async createProduct(payload: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<
      ProductApiEnvelope<ProductDetailData>
    >("/market/products", payload);

    return response.data.product;
  }

  async updateProduct(
    productId: number,
    payload: UpdateProductRequest,
  ): Promise<Product> {
    const response = await apiClient.put<
      ProductApiEnvelope<ProductDetailData>
    >(`/market/products/${productId}`, payload);

    return response.data.product;
  }

  async deleteProduct(productId: number): Promise<DeleteProductResponse> {
    const response = await apiClient.delete<
      ProductApiEnvelope<DeleteProductResponse>
    >(`/market/products/${productId}`);

    return response.data;
  }
}

export const productService = new ProductService();
