import { useState } from "react";

import { Button } from "@/components/common";
import { useAuth, usePermissions } from "@/features/auth";
import {
  useProducts,
  type CreateProductRequest,
  type Product,
} from "@/features/products";

import { ProductFormDialog } from "./ProductFormDialog";
import { ProductDeleteDialog } from "./ProductDeleteDialog";

export function ProductsPage() {
  const { permissions, selectedTenant } = useAuth();
  const { hasPermission } = usePermissions();
  const canRead = permissions.includes("product.read");
  const canCreate = permissions.includes("product.create");
  const canUpdate = permissions.includes("product.update");
  const canDelete = permissions.includes("product.delete");

  const {
    products,
    pagination,
    loading,
    loadingMore,
    creating,
    error,
    actionProductId,
    refresh,
    loadMore,
    create,
    update,
    remove,
  } = useProducts(canRead);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(price);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormOpen(true);
    setSuccessMessage(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
    setSuccessMessage(null);
  };

  const closeFormDialog = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (payload: CreateProductRequest) => {
    if (editingProduct) {
      await update(editingProduct.id, payload);
      setSuccessMessage("Product updated successfully.");
    } else {
      await create(payload);
      setSuccessMessage("Product created successfully.");
    }

    closeFormDialog();
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    setDeleteError(null);

    try {
      await remove(deletingProduct.id);
      setDeletingProduct(null);
      setSuccessMessage("Product deleted successfully.");
    } catch {
      setDeleteError("Unable to delete the product. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Products
          </h1>

          <p className="text-sm text-text-secondary">
            Manage your store products, inventory, and product information.
          </p>

          {selectedTenant && (
            <p className="text-sm font-medium text-primary">
              {selectedTenant.name}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {canRead && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          )}

          {canRead && canCreate && (
            <Button type="button" onClick={openCreateDialog}>
              Create product
            </Button>
          )}
        </div>
      </header>

      {!canRead ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-8 text-center"
        >
          <h2 className="text-lg font-semibold text-text-primary">
            Access restricted
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            You do not have permission to view workspace products.
          </p>
        </section>
      ) : (
        <>
          {successMessage && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {successMessage}
            </div>
          )}

          {loading ? (
            <section
              aria-label="Loading products"
              className="rounded-xl border border-border bg-surface p-10 text-center"
            >
              <p className="text-sm text-text-secondary">
                Loading workspace products...
              </p>
            </section>
          ) : error ? (
            <section
              role="alert"
              className="space-y-4 rounded-xl border border-danger/30 bg-surface p-8 text-center"
            >
              <h2 className="text-lg font-semibold text-text-primary">
                Unable to load products
              </h2>

              <p className="text-sm text-text-secondary">{error}</p>

              <Button
                type="button"
                variant="primary"
                onClick={() => void refresh()}
              >
                Try again
              </Button>
            </section>
          ) : products.length === 0 ? (
            <section
              aria-label="Products"
              className="rounded-xl border border-border bg-surface p-10 text-center"
            >
              <h2 className="text-lg font-semibold text-text-primary">
                No products found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                There are currently no products associated with this workspace.
              </p>

              {canRead && canCreate && (
                <div className="mt-5">
                  <Button type="button" onClick={openCreateDialog}>
                    Create your first product
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-secondary">Loaded products</p>

                  <p className="mt-2 text-2xl font-bold text-text-primary">
                    {products.length}
                  </p>
                </article>

                <article className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-secondary">Active products</p>

                  <p className="mt-2 text-2xl font-bold text-text-primary">
                    {products.filter((product) => product.is_active).length}
                  </p>
                </article>

                <article className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-secondary">
                    Inactive products
                  </p>

                  <p className="mt-2 text-2xl font-bold text-text-primary">
                    {products.filter((product) => !product.is_active).length}
                  </p>
                </article>
              </section>

              <section
                aria-label="Workspace products"
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-212.5 text-left text-sm">
                    <thead className="border-b border-border bg-background">
                      <tr>
                        <th className="px-5 py-4 font-semibold text-text-secondary">
                          Product
                        </th>

                        <th className="px-5 py-4 font-semibold text-text-secondary">
                          Price
                        </th>

                        <th className="px-5 py-4 font-semibold text-text-secondary">
                          Stock
                        </th>

                        <th className="px-5 py-4 font-semibold text-text-secondary">
                          Status
                        </th>

                        {(canUpdate || canDelete) && (
                          <th className="px-5 py-4 text-right font-semibold text-text-secondary">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {products.map((product) => {
                        const isActionLoading = actionProductId === product.id;

                        return (
                          <tr
                            key={product.id}
                            className="transition-colors hover:bg-background/60"
                          >
                            <td className="max-w-sm px-5 py-4">
                              <div className="space-y-1">
                                <p className="font-medium text-text-primary">
                                  {product.name}
                                </p>

                                <p className="line-clamp-2 text-xs text-text-secondary">
                                  {product.description || "No description"}
                                </p>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-medium text-text-primary">
                              {formatPrice(product.price)}
                            </td>

                            <td className="px-5 py-4 text-text-secondary">
                              {formatPrice(product.stock)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  product.is_active
                                    ? "bg-success/10 text-success"
                                    : "bg-surface-secondary text-text-secondary"
                                }`}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>

                            {(canUpdate || canDelete) && (
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  {canUpdate && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={isActionLoading}
                                      onClick={() => openEditDialog(product)}
                                    >
                                      Edit
                                    </Button>
                                  )}

                                  {canDelete && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="danger"
                                      disabled={isActionLoading}
                                      loading={isActionLoading}
                                      onClick={() => {
                                        setDeleteError(null);
                                        setDeletingProduct(product);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {pagination?.has_more && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadMore()}
                    loading={loadingMore}
                    disabled={loadingMore}
                  >
                    Load more products
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {formOpen && (
        <ProductFormDialog
          product={editingProduct}
          submitting={
            editingProduct ? actionProductId === editingProduct.id : creating
          }
          onClose={closeFormDialog}
          onSubmit={handleFormSubmit}
        />
      )}

      {deletingProduct && (
        <ProductDeleteDialog
          product={deletingProduct}
          deleting={actionProductId === deletingProduct.id}
          onClose={() => {
            setDeletingProduct(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      )}

      {deleteError && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-60 max-w-sm rounded-lg border border-danger/30 bg-surface px-4 py-3 text-sm text-danger shadow-lg"
        >
          {deleteError}
        </div>
      )}
    </div>
  );
}
