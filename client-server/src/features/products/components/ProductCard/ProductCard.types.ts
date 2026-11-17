
import type { ReactNode } from "react";

export type ProductStockStatus =
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

export type ProductAddToCartVariant =
  | "button"
  | "quantity";

export interface ProductPrice {
  amount: number;
  currency?: string;
  formatted: string;
  originalAmount?: number;
  originalFormatted?: string;
  discountPercentage?: number;
}

export interface ProductRating {
  value: number;
  count: number;
}

export interface ProductCardData {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  category?: string;
  brand?: string;
  price: ProductPrice;
  rating?: ProductRating;
  stockStatus: ProductStockStatus;
  badge?: string;
  isFavorite?: boolean;
}

export interface ProductCardProps {
  product: ProductCardData;
  favorite?: boolean;
  onFavoriteChange?: (
    product: ProductCardData,
    isFavorite: boolean,
  ) => void;
  onProductClick?: (
    product: ProductCardData,
  ) => void;
  onAddToCart?: (
    product: ProductCardData,
    quantity: number,
  ) => void;
  addToCartVariant?: ProductAddToCartVariant;
  initialQuantity?: number;
  onQuantityChange?: (
    product: ProductCardData,
    quantity: number,
  ) => void;
  actions?: ReactNode;
  className?: string;
}
