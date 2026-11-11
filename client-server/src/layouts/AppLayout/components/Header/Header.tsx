import {
  Link,
} from "react-router-dom";


import {
  ThemeToggle,
} from "@/components";


import {
  useAuth,
} from "@/features/auth";


import {
  UserMenu,
} from "./UserMenu";


interface HeaderProps {

  onMenuOpen: () => void;

}


/**
 * Application global header.
 *
 * Responsibilities:
 * - Display application identity.
 * - Display responsive mobile navigation trigger.
 * - Display theme controls.
 * - Display authenticated user actions.
 *
 * Mobile navigation state remains owned by AppLayout.
 */
export function Header(
  {
    onMenuOpen,
  }: HeaderProps,
) {

  const {
    user,
  } = useAuth();


  return (

    <header
      className="
        border-b
        border-border
        bg-surface
        px-4
        py-3
        sm:px-6
        sm:py-4
      "
    >

      <div
        className="
          flex
          min-w-0
          items-center
          justify-between
          gap-3
        "
      >

        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
            sm:gap-3
          "
        >

          {/* Mobile navigation trigger */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuOpen}
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              rounded-md
              p-2
              text-text-secondary
              transition-colors
              hover:bg-surface-secondary
              hover:text-text-primary
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary/30
              lg:hidden
            "
          >

            <span
              aria-hidden="true"
              className="text-xl leading-none"
            >
              ☰
            </span>

          </button>


          <h1
            className="
              truncate
              text-base
              font-semibold
              text-text-primary
              sm:text-lg
            "
          >

            Application

          </h1>

        </div>


        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
            sm:gap-3
          "
        >

          <ThemeToggle />


          {
            user ? (

              <UserMenu />

            ) : (

              <Link
                to="/login"
                className="
                  rounded-md
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-text-primary
                  transition-colors
                  hover:bg-surface-secondary
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-primary/30
                  sm:px-4
                "
              >

                Login

              </Link>

            )
          }

        </div>

      </div>

    </header>

  );

}