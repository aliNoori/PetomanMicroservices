export interface HomeProduct {
  id: number;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface HomeProductTenant {
  id: string;
  name: string;
  slug: string;
}

export interface HomeProductsPagination {
  per_page: number;
  has_more: boolean;
  next_cursor: string | null;
  previous_cursor: string | null;
}

export interface HomeProductsData {
  tenants: HomeProductTenant[];
  products: HomeProduct[];
}

export interface HomeProductsResponse {
  data: HomeProductsData;
  pagination: HomeProductsPagination | null;
}
