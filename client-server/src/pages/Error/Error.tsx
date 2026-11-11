import { useRouteError } from "react-router-dom";

export default function Error() {
  const error = useRouteError();

  console.error(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-lg rounded-xl border border-border bg-surface-elevated p-8 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-danger/10 font-bold text-danger">
            !
          </div>

          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Something went wrong
            </h1>

            <p className="mt-2 text-text-secondary">
              An unexpected application error occurred.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-text-muted">
            Please try again or return to the home page.
          </p>
        </div>

        <button className="mt-6 rounded-md bg-danger px-5 py-2.5 font-medium text-text-inverse transition hover:opacity-90">
          Return Home
        </button>
      </section>
    </main>
  );
}