
import { useState } from "react";

import type { FormEvent } from "react";

import { Button, Input } from "@/components/common";

import type {
  Product,
  CreateProductRequest,
} from "@/features/products";

interface ProductFormDialogProps {
  product: Product | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProductRequest) => Promise<void>;
}

interface ProductFormErrors {
  name?: string;
  price?: string;
  stock?: string;
}

export function ProductFormDialog({
  product,
  submitting,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(
    product?.description ?? "",
  );
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: ProductFormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Product name is required.";
    } else if (name.trim().length > 255) {
      nextErrors.name = "Product name cannot exceed 255 characters.";
    }

    const parsedPrice = Number(price);

    if (
      price.trim() === "" ||
      !Number.isSafeInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      nextErrors.price = "Enter a valid non-negative integer.";
    }

    const parsedStock = Number(stock);

    if (
      stock.trim() === "" ||
      !Number.isSafeInteger(parsedStock) ||
      parsedStock < 0
    ) {
      nextErrors.stock = "Enter a valid non-negative integer.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const payload: CreateProductRequest = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      stock: Number(stock),
      is_active: isActive,
    };

    try {
      await onSubmit(payload);
    } catch {
      setSubmitError("Unable to save the product. Please try again.");
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        overflow-y-auto
        bg-black/50
        p-4
      "
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="
          my-auto w-full max-w-xl
          rounded-2xl border border-border
          bg-surface p-6 shadow-xl
        "
      >
        <header className="mb-6 space-y-2">
          <h2
            id="product-dialog-title"
            className="text-xl font-bold text-text-primary"
          >
            {product ? "Edit product" : "Create product"}
          </h2>

          <p className="text-sm text-text-secondary">
            {product
              ? "Update the product information."
              : "Enter the information for your new product."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Product name"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="Enter product name"
            maxLength={255}
            required
            disabled={submitting}
            error={errors.name}
          />

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="product-description"
              className="text-sm font-medium text-text-primary"
            >
              Description
            </label>

            <textarea
              id="product-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter product description (optional)"
              rows={4}
              disabled={submitting}
              className="
                w-full resize-y rounded-lg
                border border-border bg-surface
                p-3 text-sm text-text-primary
                outline-none transition
                placeholder:text-text-muted
                focus:border-primary focus:ring-2 focus:ring-primary/30
                disabled:cursor-not-allowed disabled:opacity-50
              "
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              name="price"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setErrors((current) => ({ ...current, price: undefined }));
              }}
              required
              disabled={submitting}
              error={errors.price}
            />

            <Input
              label="Stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => {
                setStock(event.target.value);
                setErrors((current) => ({ ...current, stock: undefined }));
              }}
              required
              disabled={submitting}
              error={errors.stock}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting}
              className="
                size-4 rounded border-border
                accent-primary
                focus:ring-2 focus:ring-primary/30
              "
            />

            <span className="text-sm font-medium text-text-primary">
              Product is active
            </span>
          </label>

          {submitError && (
            <p role="alert" className="text-sm text-danger">
              {submitError}
            </p>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              {product ? "Save changes" : "Create product"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
