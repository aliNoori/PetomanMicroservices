
export function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Orders
        </h1>

        <p className="text-sm text-text-secondary">
          View and manage customer orders across your store.
        </p>
      </header>

      <section
        aria-label="Orders"
        className="rounded-xl border border-border bg-surface p-8 text-center"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Order management
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Your orders will appear here when the order management API is
          connected.
        </p>
      </section>
    </div>
  );
}
