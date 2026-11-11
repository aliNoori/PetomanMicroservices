import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "./ProductCard";
import type { ProductCardData } from "./ProductCard.types";

const product: ProductCardData = {
  id: "product-1",
  name: "Premium Adult Dog Food",
  slug: "premium-adult-dog-food",
  image: "https://example.com/dog-food.jpg",
  category: "Dog Food",
  brand: "PetCare",
  price: {
    amount: 29.9,
    currency: "EUR",
    formatted: "€29.90",
    originalAmount: 34.9,
    originalFormatted: "€34.90",
    discountPercentage: 14,
  },
  rating: {
    value: 4.8,
    count: 124,
  },
  stockStatus: "in-stock",
  badge: "Best Seller",
};

describe("ProductCard", () => {
  it("renders product information", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("Premium Adult Dog Food")).toBeInTheDocument();
    expect(screen.getByText("Dog Food")).toBeInTheDocument();
    expect(screen.getByText("PetCare")).toBeInTheDocument();
    expect(screen.getByText("€29.90")).toBeInTheDocument();
    expect(screen.getByText("€34.90")).toBeInTheDocument();
    expect(screen.getByText("-14%")).toBeInTheDocument();
    expect(screen.getByText("Best Seller")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  it("renders rating information", () => {
    render(<ProductCard product={product} />);

    expect(
      screen.getByLabelText("Rated 4.8 out of 5 from 124 reviews"),
    ).toBeInTheDocument();
  });

  it("calls onProductClick", async () => {
    const user = userEvent.setup();
    const onProductClick = vi.fn();

    render(<ProductCard product={product} onProductClick={onProductClick} />);

    await user.click(
      screen.getByRole("button", {
        name: "View Premium Adult Dog Food",
      }),
    );

    expect(onProductClick).toHaveBeenCalledWith(product);
  });

  it("calls onAddToCart", async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();

    render(<ProductCard product={product} onAddToCart={onAddToCart} />);

    await user.click(
      screen.getByRole("button", {
        name: "Add to cart",
      }),
    );

    expect(onAddToCart).toHaveBeenCalledWith(product, 1);
  });

  it("toggles favorite", async () => {
    const user = userEvent.setup();
    const onFavoriteChange = vi.fn();

    render(
      <ProductCard product={product} onFavoriteChange={onFavoriteChange} />,
    );

    const favoriteButton = screen.getByRole("button", {
      name: "Add Premium Adult Dog Food to favorites",
    });

    expect(favoriteButton).toHaveAttribute("aria-pressed", "false");

    await user.click(favoriteButton);

    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");

    expect(onFavoriteChange).toHaveBeenCalledWith(product, true);
  });

  it("respects initial favorite state", () => {
    render(
      <ProductCard
        product={{
          ...product,
          isFavorite: true,
        }}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Remove Premium Adult Dog Food from favorites",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("disables add to cart when product is out of stock", () => {
    render(
      <ProductCard
        product={{
          ...product,
          stockStatus: "out-of-stock",
        }}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Unavailable",
      }),
    ).toBeDisabled();

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("does not call add to cart when unavailable", async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();

    render(
      <ProductCard
        product={{
          ...product,
          stockStatus: "out-of-stock",
        }}
        onAddToCart={onAddToCart}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Unavailable",
    });

    await user.click(button);

    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it("supports low stock state", () => {
    render(
      <ProductCard
        product={{
          ...product,
          stockStatus: "low-stock",
        }}
      />,
    );

    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });

  it("supports custom className", () => {
    const { container } = render(
      <ProductCard product={product} className="custom-product-card" />,
    );

    expect(container.firstChild).toHaveClass("custom-product-card");
  });

  it("supports products without optional fields", () => {
    render(
      <ProductCard
        product={{
          id: "product-2",
          name: "Basic Pet Toy",
          slug: "basic-pet-toy",
          image: "https://example.com/toy.jpg",
          category: "Pet Toys",
          price: {
            amount: 19.9,
            currency: "EUR",
            formatted: "€19.90",
          },
          stockStatus: "in-stock",
        }}
      />,
    );

    expect(screen.getByText("Basic Pet Toy")).toBeInTheDocument();
    expect(screen.getByText("€19.90")).toBeInTheDocument();
  });
});
