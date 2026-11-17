export interface Product {
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

export interface ProductPagination {
  per_page: number;
  has_more: boolean;
  next_cursor: string | null;
  previous_cursor: string | null;
}

export interface ProductListData {
  tenant_id: string;
  products: Product[];
}

export interface ProductDetailData {
  tenant_id: string;
  product: Product;
}

export interface ProductListResponse {
  data: ProductListData;
  pagination: ProductPagination | null;
}

export interface CreateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  is_active?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  is_active?: boolean;
}

export interface DeleteProductResponse {
  tenant_id: string;
  product_id: number;
}
