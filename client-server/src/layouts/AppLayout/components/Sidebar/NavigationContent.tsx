import {
  NavLink,
} from "react-router-dom";


import {
  navigationConfig,
} from "./navigation";


/**
 * Shared navigation content.
 *
 * This component owns navigation rendering only.
 *
 * Container responsibilities such as:
 * - width
 * - borders
 * - scrolling
 * - positioning
 * - mobile drawer behavior
 *
 * remain outside this component.
 *
 * This allows the same navigation structure
 * to be reused by both desktop and mobile layouts.
 */
export function NavigationContent() {

  return (

    <nav
      aria-label="Primary navigation"
      className="space-y-5 sm:space-y-6"
    >

      {
        navigationConfig.map(
          (group) => {

            if (group.items.length === 0) {
              return null;
            }


            return (

              <section
                key={group.id}
                aria-labelledby={`navigation-group-${group.id}`}
              >

                <h2
                  id={`navigation-group-${group.id}`}
                  className="
                    mb-2
                    px-3
                    text-[0.7rem]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >

                  {group.label}

                </h2>


                <div className="space-y-1">

                  {
                    group.items.map(
                      (item) => (

                        <NavLink
                          key={item.id}
                          to={item.path}
                          className={({ isActive }) =>
                            [

                              "block rounded-md px-3 py-2 text-sm font-medium",

                              "transition-colors duration-200",

                              "focus-visible:outline-none",
                              "focus-visible:ring-2",
                              "focus-visible:ring-primary/30",

                              "truncate",

                              isActive

                                ? "bg-primary-soft text-primary"

                                : [
                                    "text-text-secondary",
                                    "hover:bg-surface-secondary",
                                    "hover:text-text-primary",
                                  ].join(" "),

                            ].join(" ")
                          }
                        >

                          {item.label}

                        </NavLink>

                      ),
                    )
                  }

                </div>

              </section>

            );
          },
        )
      }

    </nav>

  );

}