import {
  useEffect,
} from "react";


import {
  NavigationContent,
} from "./NavigationContent";


interface MobileSidebarProps {

  open: boolean;

  onClose: () => void;

}


/**
 * Mobile navigation drawer.
 *
 * This component owns mobile navigation behavior only:
 * - Drawer visibility.
 * - Overlay interaction.
 * - Escape key handling.
 * - Body scroll locking.
 * - Mobile drawer dimensions.
 *
 * Navigation rendering remains delegated to
 * NavigationContent so desktop and mobile
 * navigation always stay synchronized.
 */
export function MobileSidebar(
  {
    open,
    onClose,
  }: MobileSidebarProps,
) {


  useEffect(
    () => {

      if (!open) {
        return;
      }


      const handleKeyDown = (
        event: KeyboardEvent,
      ) => {

        if (event.key === "Escape") {
          onClose();
        }

      };


      const previousOverflow =
        document.body.style.overflow;


      document.body.style.overflow = "hidden";


      document.addEventListener(
        "keydown",
        handleKeyDown,
      );


      return () => {

        document.body.style.overflow =
          previousOverflow;


        document.removeEventListener(
          "keydown",
          handleKeyDown,
        );

      };

    },
    [
      open,
      onClose,
    ],
  );


  if (!open) {
    return null;
  }


  return (

    <div
      className="
        fixed
        inset-0
        z-50
        lg:hidden
      "
    >

      {/* Drawer overlay */}
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


      {/* Navigation drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
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
            Navigation
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

            <span
              aria-hidden="true"
              className="text-lg leading-none"
            >
              ×
            </span>

          </button>

        </div>


        <NavigationContent />

      </aside>

    </div>

  );

}