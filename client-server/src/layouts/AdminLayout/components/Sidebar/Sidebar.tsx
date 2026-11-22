import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    id: "pending-tenants",
    label: "Pending Tenants",
    path: "/admin/tenants/pending",
  },
];

export function Sidebar() {
  return (
    <aside
      className="
        hidden w-64 shrink-0 border-r border-border
        bg-surface p-4 lg:block
      "
    >
      <nav aria-label="Admin navigation">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Platform Management
        </p>

        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
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
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
