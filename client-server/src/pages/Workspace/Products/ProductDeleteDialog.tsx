
import { Button } from "@/components/common";

import type { Product } from "@/features/products";

interface ProductDeleteDialogProps {
  product: Product;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ProductDeleteDialog({
  product,
  deleting,
  onClose,
  onConfirm,
}: ProductDeleteDialogProps) {
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        aria-describedby="delete-product-description"
        className="
          my-auto w-full max-w-md
          rounded-2xl border border-border
          bg-surface p-6 shadow-xl
        "
      >
        <div className="space-y-3">
          <h2
            id="delete-product-title"
            className="text-xl font-bold text-text-primary"
          >
            Delete product
          </h2>

          <p
            id="delete-product-description"
            className="text-sm leading-6 text-text-secondary"
          >
            Are you sure you want to delete{" "}
            <strong className="font-semibold text-text-primary">
              {product.name}
            </strong>
            ? This action cannot be undone.
          </p>
        </div>

        <footer className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={deleting}
            disabled={deleting}
            onClick={() => void onConfirm()}
          >
            Delete product
          </Button>
        </footer>
      </section>
    </div>
  );
}
