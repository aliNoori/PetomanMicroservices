
export function WorkspaceSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Store Settings
        </h1>

        <p className="text-sm text-text-secondary">
          Manage your store information and workspace configuration.
        </p>
      </header>

      <section
        aria-label="Store settings"
        className="rounded-xl border border-border bg-surface p-8 text-center"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Workspace configuration
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Your store settings will be available here when the settings API is
          connected.
        </p>
      </section>
    </div>
  );
}
