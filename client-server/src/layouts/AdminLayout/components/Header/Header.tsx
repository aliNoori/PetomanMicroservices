import { ThemeToggle } from "@/components";
import { UserMenu } from "@/layouts/AppLayout/components/Header/UserMenu";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="border-b border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuOpen}
            className="
              inline-flex shrink-0 items-center justify-center
              rounded-md p-2 text-text-secondary transition-colors
              hover:bg-surface-secondary hover:text-text-primary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary/30 lg:hidden
            "
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
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          <h1 className="truncate text-base font-semibold text-text-primary sm:text-lg">
            Platform Administration
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
