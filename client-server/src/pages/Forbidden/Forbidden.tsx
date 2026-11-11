export default function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-2xl font-bold text-warning">
          403
        </div>

        <h1 className="mt-6 text-2xl font-bold text-text-primary">
          Access Forbidden
        </h1>

        <p className="mt-3 text-text-secondary">
          You do not have permission to access this page.
        </p>

        <button className="mt-6 rounded-md bg-primary px-5 py-2.5 font-medium text-text-inverse transition hover:bg-primary-hover">
          Return Home
        </button>
      </section>
    </main>
  );
}