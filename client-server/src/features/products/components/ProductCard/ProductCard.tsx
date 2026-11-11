import { useState } from "react";

import { Card } from "../../../../components/common/Card";
import type { ProductCardProps } from "./ProductCard.types";

/**
 * Heart icon used for favorite action.
 */
function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className="size-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 8.9c0 5.4-8.8 10.1-8.8 10.1S3.2 14.3 3.2 8.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.4Z" />
    </svg>
  );
}

/**
 * Shopping cart icon.
 */
function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="M3.5 4.5h2l1.9 9.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 7.5H6.2" />{" "}
      <path d="M9 7.5h10" />{" "}
      <circle cx="10" cy="19" r="1.35" fill="currentColor" stroke="none" />{" "}
      <circle cx="18" cy="19" r="1.35" fill="currentColor" stroke="none" />{" "}
    </svg>
  );
}

/**
 * Star icon.
 */
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path d="m12 3.8 2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8L12 3.8Z" />
    </svg>
  );
}

/**
 * Minus icon.
 */
function MinusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

/**
 * Plus icon.
 */
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/**
 * Formats numeric values for compact UI presentation.
 */
function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(value);
}

/**
 * Production-ready marketplace product card.
 */
export function ProductCard({
  product,
  favorite: controlledFavorite,
  onFavoriteChange,
  onAddToCart,
  onProductClick,
  addToCartVariant = "button",
  initialQuantity = 1,
  onQuantityChange,
  className = "",
  actions,
}: ProductCardProps) {
  const [internalFavorite, setInternalFavorite] = useState(
    product.isFavorite ?? false,
  );

  const [quantity, setQuantity] = useState(
    Math.max(1, Math.floor(initialQuantity)),
  );

  /**
   * Controls whether the standard Add to Cart button
   * has already been activated.
   */
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const isFavorite =
    controlledFavorite !== undefined ? controlledFavorite : internalFavorite;

  const isOutOfStock = product.stockStatus === "out-of-stock";

  const stockLabel =
    product.stockStatus === "in-stock"
      ? "In stock"
      : product.stockStatus === "low-stock"
        ? "Low stock"
        : "Out of stock";

  /**
   * Discounted price.
   */
  const hasDiscount =
    product.price.discountPercentage !== undefined &&
    product.price.discountPercentage > 0 &&
    product.price.originalAmount !== undefined;

  const discountedAmount = product.price.amount;
  const displayPrice = product.price.formatted;

  const savings = hasDiscount
    ? product.price.originalAmount! - product.price.amount
    : 0;

  const formattedSavings = hasDiscount
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: product.price.currency,
        maximumFractionDigits: 2,
      }).format(savings)
    : "";

  /**
   * Toggle favorite.
   */
  const handleFavoriteChange = () => {
    const nextValue = !isFavorite;

    if (controlledFavorite === undefined) {
      setInternalFavorite(nextValue);
    }

    onFavoriteChange?.(product, nextValue);
  };

  /**
   * Open product.
   */
  const handleProductClick = () => {
    onProductClick?.(product);
  };

  /**
   * Add product to cart.
   */
  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    setIsAddedToCart(true);

    setQuantity((currentQuantity) => {
      const nextQuantity = Math.max(1, currentQuantity);

      onAddToCart?.(product, nextQuantity);
      onQuantityChange?.(product, nextQuantity);

      return nextQuantity;
    });
  };

  /**
   * Update quantity.
   */
  const updateQuantity = (nextQuantity: number) => {
    if (isOutOfStock) {
      return;
    }

    const normalizedQuantity = Math.max(1, Math.floor(nextQuantity));

    setQuantity(normalizedQuantity);

    onQuantityChange?.(product, normalizedQuantity);
  };

  /**
   * Increase quantity.
   */
  const handleIncreaseQuantity = () => {
    updateQuantity(quantity + 1);
  };

  /**
   * Decrease quantity.
   */
  const handleDecreaseQuantity = () => {
    if (quantity <= 1) {
      return;
    }

    updateQuantity(quantity - 1);
  };

  /**
   * Render quantity selector.
   */
  const renderQuantitySelector = () => {
    return (
      <div
        className={[
          "flex h-11 w-full items-center",
          "overflow-hidden rounded-xl",
          "border border-primary/20",
          "bg-primary/5",
          "shadow-sm",
          "transition-all duration-200",
          "hover:border-primary/35",
          "hover:bg-primary/8",
          isOutOfStock ? "opacity-50" : "",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={isOutOfStock || quantity <= 1}
          onClick={(event) => {
            event.stopPropagation();
            handleDecreaseQuantity();
          }}
          className={[
            "flex h-full w-12 shrink-0 items-center justify-center",
            "text-danger",
            "transition-all duration-150",
            "hover:bg-danger/10",
            "active:scale-90",
            "disabled:cursor-not-allowed",
            "disabled:opacity-30",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-inset",
            "focus-visible:ring-danger/40",
          ].join(" ")}
        >
          <MinusIcon />
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <CartIcon />

          <span
            aria-label={`Quantity ${quantity}`}
            className="text-sm font-bold tabular-nums text-text-primary"
          >
            {quantity}
          </span>
        </div>

        <button
          type="button"
          aria-label="Increase quantity"
          disabled={isOutOfStock}
          onClick={(event) => {
            event.stopPropagation();
            handleIncreaseQuantity();
          }}
          className={[
            "flex h-full w-12 shrink-0 items-center justify-center",
            "text-success",
            "transition-all duration-150",
            "hover:bg-success/10",
            "active:scale-90",
            "disabled:cursor-not-allowed",
            "disabled:opacity-30",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-inset",
            "focus-visible:ring-success/40",
          ].join(" ")}
        >
          <PlusIcon />
        </button>
      </div>
    );
  };

  return (
    <Card
      clickable={Boolean(onProductClick)}
      onClick={onProductClick ? handleProductClick : undefined}
      aria-label={onProductClick ? `View ${product.name}` : undefined}
      className={[
        "group",
        "overflow-hidden",
        "rounded-2xl",
        "border border-border/70",
        "bg-surface",
        "shadow-sm",
        "transition-all duration-300",
        "hover:-translate-y-1",
        "hover:border-primary/20",
        "hover:shadow-xl",
        className,
      ].join(" ")}
    >
      {/* ============================================================= */}
      {/* PRODUCT MEDIA                                                 */}
      {/* ============================================================= */}

      <div className="relative aspect-video overflow-hidden bg-surface-elevated">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={[
              "size-full object-cover",
              "transition-transform duration-700",
              "group-hover:scale-[1.045]",
            ].join(" ")}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-elevated text-sm text-text-muted">
            No image
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-black/5" />

        {/* Badges */}
        {(product.badge || hasDiscount) && (
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            {product.badge && (
              <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold tracking-wide text-text-inverse shadow-lg">
                {product.badge}
              </span>
            )}

            {hasDiscount && (
              <span className="rounded-full bg-danger px-3 py-1.5 text-[11px] font-bold tracking-wide text-text-inverse shadow-lg">
                -{product.price.discountPercentage}%
              </span>
            )}
          </div>
        )}

        {/* Favorite */}
        <button
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${product.name} from favorites`
              : `Add ${product.name} to favorites`
          }
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.stopPropagation();
            handleFavoriteChange();
          }}
          className={[
            "absolute right-4 top-4 z-10",
            "flex size-10 items-center justify-center",
            "rounded-full",
            "border border-white/30",
            "bg-background/85",
            "backdrop-blur-md",
            "shadow-lg",
            "transition-all duration-200",
            "hover:scale-105",
            "hover:border-primary/30",
            "hover:text-primary",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-primary/40",
            isFavorite ? "text-primary" : "text-text-primary",
          ].join(" ")}
        >
          <HeartIcon filled={isFavorite} />
        </button>

        {/* Stock */}
        <div className="absolute bottom-4 left-4 z-10">
          <span
            className={[
              "inline-flex items-center gap-1.5",
              "rounded-full",
              "border border-white/20",
              "bg-background/85",
              "px-2.5 py-1",
              "text-[10px] font-semibold",
              "backdrop-blur-md",
              "shadow-md",
              product.stockStatus === "in-stock"
                ? "text-success"
                : product.stockStatus === "low-stock"
                  ? "text-warning"
                  : "text-danger",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "size-1.5 rounded-full",
                product.stockStatus === "in-stock"
                  ? "bg-success"
                  : product.stockStatus === "low-stock"
                    ? "bg-warning"
                    : "bg-danger",
              ].join(" ")}
            />

            {stockLabel}
          </span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* PRODUCT CONTENT                                               */}
      {/* ============================================================= */}

      <div className="p-5">
        {/* META */}
        <div className="flex min-h-5 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              {product.category}
            </span>

            {product.brand && (
              <>
                <span className="text-text-muted/40">•</span>

                <span className="truncate text-xs text-text-muted">
                  {product.brand}
                </span>
              </>
            )}
          </div>

          {product.rating && (
            <div
              className="flex shrink-0 items-center gap-1.5"
              aria-label={`Rated ${product.rating.value.toFixed(
                1,
              )} out of 5 from ${formatCount(product.rating.count)} reviews`}
            >
              <span className="text-primary">
                <StarIcon />
              </span>

              <span className="text-sm font-bold text-text-primary">
                {product.rating.value.toFixed(1)}
              </span>

              <span className="text-xs text-text-muted">
                ({formatCount(product.rating.count)})
              </span>
            </div>
          )}
        </div>

        {/* NAME */}
        <div className="mt-3 min-h-14">
          <h3 className="line-clamp-2 text-xl font-semibold leading-7 tracking-tight text-text-primary transition-colors duration-200 group-hover:text-primary">
            {product.name}
          </h3>
        </div>

        {/* PRICE */}
        <div className="mt-5">
          <div className="flex min-h-14 items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl font-extrabold leading-none tracking-tight text-text-primary">
                  {displayPrice}
                </span>

                {hasDiscount && (
                  <span className="text-sm text-text-muted line-through">
                    {product.price.originalFormatted}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <div className="mt-1.5">
                  <span className="text-xs font-semibold text-success">
                    Save {formattedSavings}
                  </span>
                </div>
              )}
            </div>

            <div className="flex w-20 shrink-0 justify-end">
              {hasDiscount ? (
                <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-danger">
                  {product.price.discountPercentage}% OFF
                </span>
              ) : (
                <span className="invisible rounded-full px-2.5 py-1 text-[10px]">
                  0% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* CART ACTION                                                   */}
        {/* ============================================================= */}

        <div className="mt-5">
          {addToCartVariant === "quantity" || isAddedToCart ? (
            renderQuantitySelector()
          ) : (
            <button
              type="button"
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? "Unavailable" : "Add to cart"}
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart();
              }}
              className={[
                "group/cart",
                "flex h-11 w-full items-center justify-center gap-2",
                "rounded-xl",
                "bg-primary",
                "px-4",
                "text-sm font-bold text-text-inverse",
                "shadow-sm",
                "transition-all duration-200",
                "hover:bg-primary-hover",
                "hover:shadow-md",
                "active:scale-[0.98]",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-primary/40",
              ].join(" ")}
            >
              {/* Cart */}
              <span className="relative inline-flex shrink-0">
                <CartIcon />

                {/* Floating quantity badge */}
                {quantity > 1 && (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute",
                      "-right-3",
                      "-top-3",
                      "z-20",

                      "flex",
                      "size-5",
                      "items-center",
                      "justify-center",

                      "rounded-full",
                      "bg-danger",

                      "text-[10px]",
                      "font-extrabold",
                      "leading-none",
                      "text-text-inverse",

                      "shadow-lg",

                      "ring-2",
                      "ring-primary",

                      "tabular-nums",

                      "transition-transform",
                      "duration-200",

                      "group-hover/cart:scale-110",
                    ].join(" ")}
                  >
                    {quantity}
                  </span>
                )}
              </span>

              <span>{isOutOfStock ? "Unavailable" : "Add to cart"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ADDITIONAL ACTIONS */}
      {actions && (
        <div className="border-t border-border bg-surface-elevated/50 px-5 py-3">
          {actions}
        </div>
      )}
    </Card>
  );
}
