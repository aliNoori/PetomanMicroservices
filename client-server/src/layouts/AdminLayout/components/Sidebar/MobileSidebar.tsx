import { NavLink } from "react-router-dom";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  open,
  onClose,
}: MobileSidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-surface p-4 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            Platform Administration
          </h2>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav aria-label="Admin mobile navigation">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Platform Management
          </p>

          <NavLink
            to="/admin/tenants/pending"
            onClick={onClose}
            className={({ isActive }) =>
              `
                block rounded-md px-3 py-2 text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }
              `
            }
          >
            Pending Tenants
          </NavLink>
        </nav>
      </aside>
    </div>
  );
}
