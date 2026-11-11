import type { NavigationGroup } from "./navigation.types";

/**
 * Application navigation configuration.
 *
 * This configuration is intentionally separated
 * from Sidebar rendering logic.
 *
 * Future capabilities:
 * - Capability based filtering
 * - Role based visibility
 * - Feature flags
 */
export const navigationConfig: NavigationGroup[] = [
  {
    id: "main",

    label: "Main",

    items: [
      {
        id: "home",

        label: "Home",

        path: "/",
      },

      {
        id: "profile",

        label: "Profile",

        path: "/profile",
      },
    ],
  },
];
