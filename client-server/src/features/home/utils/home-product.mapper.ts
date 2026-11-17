import type { ProductCardData } from "@/features/products/components/ProductCard/ProductCard.types";
import type { HomeProduct } from "../types/home-products.types";

const tomanFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function mapHomeProductToCard(
  product: HomeProduct,
): ProductCardData {
  return {
    id: String(product.id),
    name: product.name,
    price: {
      amount: product.price,
      formatted: `${tomanFormatter.format(product.price)} تومان`,
    },
    stockStatus: product.stock > 0 ? "in-stock" : "out-of-stock",
  };
}
