import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/features/profile/components/UserAvatar/UserAvatar";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";

import type { UserMenuProps } from "./UserMenu.types";

/**
 * User menu.
 *
 * Provides authenticated user identity,
 * tenant switching, and user-specific actions.
 */
export function UserMenu({ children }: UserMenuProps) {
  const { user, logout, tenants, selectedTenant, selectTenant } = useAuth();

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(
    null,
  );
  const [tenantSwitchError, setTenantSwitchError] = useState<string | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  const avatarInitial = (
    user?.firstName?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const handleProfile = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const handleCreateWorkspace = () => {
    setIsOpen(false);
    navigate("/tenants/create");
  };

  const handleTenantSwitch = async (tenantId: string) => {
    if (switchingTenantId !== null) {
      return;
    }

    // Navigate directly when the selected tenant is already active.
    if (tenantId === selectedTenant?.id) {
      setIsOpen(false);

      navigate(`/workspace/${tenantId}/dashboard`, {
        replace: true,
      });

      return;
    }

    setSwitchingTenantId(tenantId);
    setTenantSwitchError(null);

    try {
      await selectTenant(tenantId);

      setIsOpen(false);

      navigate(`/workspace/${tenantId}/dashboard`, {
        replace: true,
      });
    } catch {
      setTenantSwitchError("Unable to switch workspace. Please try again.");
    } finally {
      setSwitchingTenantId(null);
    }
  };

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
    <div ref={containerRef} className="relative min-w-0">
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
        <UserAvatar
          avatarUrl={user?.avatarUrl}
          fallback={avatarInitial}
          size="sm"
        />

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
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              fallback={avatarInitial}
              size="md"
            />

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

          {/* Tenant switcher */}

          {tenants.length >= 1 && (
            <div className="border-b border-border p-3">
              <p
                className="
                  mb-2
                  px-1
                  text-xs
                  font-semibold
                  text-text-secondary
                "
              >
                Your workspaces
              </p>

              <div className="space-y-1">
                {tenants.map((tenant) => {
                  const isSelected = selectedTenant?.id === tenant.id;
                  const isSwitching = switchingTenantId === tenant.id;

                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      role="menuitem"
                      disabled={switchingTenantId !== null}
                      aria-current={isSelected ? "page" : undefined}
                      onClick={() => handleTenantSwitch(tenant.id)}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition",
                        isSelected
                          ? "bg-surface-secondary text-text-primary"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {tenant.name}
                        </span>

                        <span className="mt-0.5 block truncate text-xs text-text-muted">
                          {tenant.slug}
                        </span>
                      </span>

                      {isSwitching ? (
                        <span
                          className="shrink-0 text-xs text-text-muted"
                          aria-live="polite"
                        >
                          Switching...
                        </span>
                      ) : isSelected ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-primary"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.415l-7.25 7.25a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 011.415-1.415l2.793 2.793 6.543-6.543a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {tenantSwitchError && (
                <p role="alert" className="mt-2 px-1 text-xs text-red-600">
                  {tenantSwitchError}
                </p>
              )}
            </div>
          )}

          {/* Menu items */}

          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleCreateWorkspace}
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
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create workspace
            </button>
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
                <circle cx="12" cy="7" r="4" />
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
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>

              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
