import { NavLink, useParams } from "react-router-dom";

import { usePermissions } from "@/features/auth";

import { workspaceNavigationConfig } from "./navigation/navigation.config";

import type { WorkspaceNavigationItem } from "./navigation/navigation.types";

interface NavigationContentProps {
  onNavigate?: () => void;
}

export function NavigationContent({ onNavigate }: NavigationContentProps) {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { hasAllPermissions } = usePermissions();

  if (!tenantId) {
    return null;
  }

  const hasAccess = (item: WorkspaceNavigationItem): boolean => {
    return hasAllPermissions(item.requiredPermissions ?? []);
  };

  return (
    <nav aria-label="Workspace navigation" className="space-y-5 sm:space-y-6">
      {workspaceNavigationConfig.map((group) => {
        const visibleItems = group.items.filter(hasAccess);

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <section
            key={group.id}
            aria-labelledby={`workspace-navigation-group-${group.id}`}
          >
            <h2
              id={`workspace-navigation-group-${group.id}`}
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
              {visibleItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={`/workspace/${tenantId}/${item.path}`}
                  onClick={onNavigate}
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
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
