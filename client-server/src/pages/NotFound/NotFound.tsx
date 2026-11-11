export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-lg rounded-xl border border-border bg-surface-elevated p-10 text-center shadow-md">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Page Not Found
        </p>

        <h1 className="mt-3 text-7xl font-bold tracking-tight text-text-primary">
          404
        </h1>

        <p className="mx-auto mt-4 max-w-md text-text-secondary">
          The page you are looking for does not exist or may have been moved.
        </p>

        <button className="mt-8 rounded-md bg-primary px-5 py-2.5 font-medium text-text-inverse transition hover:bg-primary-hover">
          Go Home
        </button>
      </section>
    </main>
  );
}