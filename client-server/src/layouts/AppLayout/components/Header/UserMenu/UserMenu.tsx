import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "@/features/auth";

import type {
  UserMenuProps,
} from "./UserMenu.types";


/**
 * User menu.
 *
 * Provides authenticated user identity
 * and user-specific application actions.
 *
 * Responsibilities:
 * - Display authenticated user identity.
 * - Provide deterministic avatar fallback.
 * - Toggle the user dropdown.
 * - Navigate to the profile page.
 * - Trigger logout through AuthContext.
 * - Handle outside-click dismissal.
 * - Prevent duplicate logout requests.
 *
 * Responsive behavior:
 * - Mobile: compact avatar-based trigger.
 * - Desktop: avatar, name, email, and chevron.
 *
 * Non-responsibilities:
 * - Authentication state management.
 * - Token storage.
 * - Authorization rules.
 */
export function UserMenu(
  {
    children,
  }: UserMenuProps,
) {

  const {
    user,
    logout,
  } = useAuth();


  const navigate = useNavigate();


  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);


  const containerRef = useRef<HTMLDivElement>(null);


  /**
   * Resolve the user's display name.
   *
   * Prefer first and last name.
   * Fall back to email when no name exists.
   */
  const fullName =
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "User";


  /**
   * Resolve the avatar fallback character.
   *
   * Priority:
   * 1. First name initial.
   * 2. Email initial.
   * 3. Generic user fallback.
   */
  const avatarInitial = (
    user?.firstName?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();


  /**
   * Close the dropdown when the user clicks
   * outside the UserMenu boundary.
   */
  useEffect(() => {

    if (!isOpen) {
      return;
    }


    const handlePointerDown = (
      event: MouseEvent,
    ) => {

      const target = event.target as Node;


      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {

        setIsOpen(false);

      }

    };


    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

    };

  }, [isOpen]);


  /**
   * Navigate to the profile page
   * and close the dropdown.
   */
  const handleProfile = () => {

    setIsOpen(false);

    navigate("/profile");

  };


  /**
   * Execute logout through the authentication
   * context.
   *
   * AuthGuard remains responsible for redirecting
   * unauthenticated users to the login page.
   */
  const handleLogout = async () => {

    if (isLoggingOut) {
      return;
    }


    setIsLoggingOut(true);


    try {

      await logout();

      setIsOpen(false);

    } finally {

      setIsLoggingOut(false);

    }

  };


  return (

    <div
      ref={containerRef}
      className="relative min-w-0"
    >

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${fullName}`}
        className="
          flex
          min-w-0
          shrink-0
          items-center
          gap-2
          rounded-lg
          px-1.5
          py-1.5
          text-left
          transition
          hover:bg-surface-secondary
          focus:outline-none
          focus:ring-2
          focus:ring-primary/30
          sm:gap-3
          sm:px-2
        "
      >

        {/* Avatar */}

        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-primary-soft
            text-sm
            font-semibold
            text-primary
          "
          aria-hidden="true"
        >

          {avatarInitial}

        </div>


        {/* User identity.
            Hidden on mobile to prevent header overflow. */}

        <div className="hidden min-w-0 sm:block">

          <p
            className="
              max-w-32
              truncate
              text-sm
              font-medium
              text-text-primary
              lg:max-w-48
            "
          >

            {fullName}

          </p>


          <p
            className="
              max-w-40
              truncate
              text-xs
              text-text-secondary
              lg:max-w-56
            "
          >

            {user?.email ?? "No email available"}

          </p>

        </div>


        {/* Dropdown indicator */}

        <svg
          className={[
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >

          <path
            fillRule="evenodd"
            d="
              M5.23 7.21
              a.75.75 0 011.06.02
              L10 11.168
              l3.71-3.938
              a.75.75 0 111.08 1.04
              l-4.25 4.5
              a.75.75 0 01-1.08 0
              l-4.25-4.5
              a.75.75 0 01.02-1.06z
            "
            clipRule="evenodd"
          />

        </svg>

      </button>


      {children}


      {isOpen && (

        <div
          role="menu"
          aria-label="User menu"
          className="
            absolute
            right-0
            top-full
            z-50
            mt-2
            w-[min(18rem,calc(100vw-1rem))]
            overflow-hidden
            rounded-xl
            border
            border-border
            bg-surface
            shadow-lg
          "
        >

          {/* User summary */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
              border-b
              border-border
              px-4
              py-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-primary-soft
                text-sm
                font-semibold
                text-primary
              "
              aria-hidden="true"
            >

              {avatarInitial}

            </div>


            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >

                {fullName}

              </p>


              <p
                className="
                  truncate
                  text-xs
                  text-text-secondary
                "
              >

                {user?.email ?? "No email available"}

              </p>

            </div>

          </div>


          {/* Menu items */}

          <div className="p-1">

            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-sm
                font-medium
                text-text-primary
                transition
                hover:bg-surface-secondary
                focus:outline-none
                focus:ring-2
                focus:ring-primary/30
              "
            >

              <svg
                className="h-4 w-4 shrink-0 text-text-secondary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >

                <path d="M20 21a8 8 0 0 0-16 0" />

                <circle
                  cx="12"
                  cy="7"
                  r="4"
                />

              </svg>


              Profile

            </button>


            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="
                mt-1
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-sm
                font-medium
                text-red-600
                transition
                hover:bg-red-50
                focus:outline-none
                focus:ring-2
                focus:ring-red-500/30
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >

                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

                <polyline points="16 17 21 12 16 7" />

                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                />

              </svg>


              {isLoggingOut
                ? "Logging out..."
                : "Logout"
              }

            </button>

          </div>

        </div>

      )}

    </div>

  );

}
