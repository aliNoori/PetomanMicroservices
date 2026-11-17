
import { useEffect } from "react";

import { NavigationContent } from "./NavigationContent";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  open,
  onClose,
}: MobileSidebarProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="
          absolute
          inset-0
          bg-black/40
          backdrop-blur-[1px]
        "
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile workspace navigation"
        className="
          relative
          z-10
          flex
          h-full
          w-[min(18rem,85vw)]
          flex-col
          overflow-y-auto
          border-r
          border-border
          bg-surface
          p-3
          shadow-lg
          sm:w-72
          sm:p-4
        "
      >
        <div className="mb-4 flex items-center justify-between">
          <span
            className="
              px-3
              text-sm
              font-semibold
              text-text-primary
            "
          >
            Workspace
          </span>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="
              rounded-md
              p-2
              text-text-secondary
              transition-colors
              hover:bg-surface-secondary
              hover:text-text-primary
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary/30
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
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <NavigationContent onNavigate={onClose} />
      </aside>
    </div>
  );
}
