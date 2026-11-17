import { useHomeProducts } from "../../hooks";
import { mapHomeProductToCard } from "../../utils";
import { ProductCard } from "../../../products/components/ProductCard";

export function ProductSection() {
  const {
    products,
    tenants,
    pagination,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
  } = useHomeProducts();

  const tenantNames = new Map(
    tenants.map((tenant) => [tenant.id, tenant.name]),
  );

  return (
    <section
      aria-labelledby="featured-products-title"
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Marketplace
          </p>

          <h2
            id="featured-products-title"
            className="mt-2 text-3xl font-bold tracking-tight text-text-primary"
          >
            Featured Products
          </h2>

          <p className="mt-2 max-w-2xl text-text-secondary">
            Discover available products from stores across the marketplace.
          </p>
        </div>
      </div>

      {loading && products.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="aspect-video bg-surface-elevated" />
              <div className="space-y-4 p-5">
                <div className="h-4 w-1/3 rounded bg-surface-elevated" />
                <div className="h-6 w-3/4 rounded bg-surface-elevated" />
                <div className="h-8 w-1/2 rounded bg-surface-elevated" />
                <div className="h-11 rounded-xl bg-surface-elevated" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && products.length === 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center"
        >
          <p className="font-semibold text-text-primary">
            Unable to load products.
          </p>

          <p className="mt-2 text-sm text-text-secondary">
            Please check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-lg font-semibold text-text-primary">
            No products available
          </p>

          <p className="mt-2 text-sm text-text-secondary">
            There are no available products in the marketplace right now.
          </p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const storeName = tenantNames.get(product.tenant_id);

              return (
                <ProductCard
                  key={`${product.tenant_id}-${product.id}`}
                  product={mapHomeProductToCard(product)}
                  actions={
                    storeName ? (
                      <p className="truncate text-xs text-text-secondary">
                        Sold by{" "}
                        <span className="font-semibold text-text-primary">
                          {storeName}
                        </span>
                      </p>
                    ) : undefined
                  }
                />
              );
            })}
          </div>

          {error && (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-center sm:flex-row sm:justify-between"
            >
              <p className="text-sm text-text-secondary">
                Failed to load more products.
              </p>

              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          )}

          {pagination?.has_more && !error && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="min-w-40 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
