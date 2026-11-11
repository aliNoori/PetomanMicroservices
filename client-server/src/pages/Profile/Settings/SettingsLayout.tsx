import {
  NavLink,
  Outlet,
} from "react-router-dom";


/**
 * Profile settings layout.
 *
 * This layout defines the shared navigation boundary
 * for account-level settings pages.
 *
 * Responsibilities:
 * - Render the settings page header.
 * - Render settings navigation.
 * - Host nested settings routes through Outlet.
 *
 * Non-responsibilities:
 * - Authentication.
 * - Authorization.
 * - Settings business logic.
 * - Feature-specific state.
 */
export function SettingsLayout() {

  return (

    <div className="mx-auto w-full max-w-5xl">


      {/* Page header */}

      <div className="mb-8">

        <h1 className="text-2xl font-semibold text-text-primary">

          Settings

        </h1>


        <p className="mt-1 text-sm text-text-secondary">

          Manage your account and security preferences.

        </p>

      </div>



      <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">


        {/* Settings navigation */}

        <aside>

          <nav
            aria-label="Profile settings navigation"
            className="space-y-1"
          >


            <NavLink
              to="/profile/settings"
              end
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",

                  "focus:outline-none focus:ring-2 focus:ring-primary/30",

                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                ].join(" ")
              }
            >

              Account

            </NavLink>



            <NavLink
              to="/profile/settings/change-password"
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",

                  "focus:outline-none focus:ring-2 focus:ring-primary/30",

                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                ].join(" ")
              }
            >

              Change Password

            </NavLink>



            <NavLink
              to="/profile/settings/sessions"
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",

                  "focus:outline-none focus:ring-2 focus:ring-primary/30",

                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                ].join(" ")
              }
            >

              Sessions

            </NavLink>


          </nav>

        </aside>



        {/* Nested settings route content */}

        <main className="min-w-0">

          <Outlet />

        </main>


      </div>


    </div>

  );

}