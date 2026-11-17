import { apiClient } from "@/lib/api/client";

import type { ApiResponse } from "@/lib/api/api-response.types";
import type {
  HomeProductsData,
  HomeProductsPagination,
  HomeProductsResponse,
} from "../types/home-products.types";

interface HomeProductsApiMeta {
  requestId?: string;
  timestamp: string;
  pagination?: HomeProductsPagination | null;
}

type HomeProductsApiResponse = Omit<ApiResponse<HomeProductsData>, "meta"> & {
  meta: HomeProductsApiMeta;
};

class HomeService {
  async getHomeProducts(
    cursor?: string,
  ): Promise<HomeProductsResponse> {
    const response = await apiClient.getResponse<HomeProductsData>(
      "/market/public/home-products",
      {
        params: cursor ? { cursor } : undefined,
      },
    ) as HomeProductsApiResponse;

    return {
      data: response.data,
      pagination: response.meta.pagination ?? null,
    };
  }
}

export const homeService = new HomeService();
