
import type {
  WorkspaceNavigationGroup,
} from "./navigation.types";

export const workspaceNavigationConfig: WorkspaceNavigationGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "dashboard",
      },
    ],
  },
  {
    id: "store",
    label: "Store",
    items: [
      {
        id: "products",
        label: "Products",
        path: "products",
        requiredPermissions: ["product.read"],
      },
      {
        id: "orders",
        label: "Orders",
        path: "orders",
        requiredPermissions: ["order.read"],
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "settings",
        label: "Store Settings",
        path: "settings",
        requiredPermissions: ["tenant.update"],
      },
      {
        id: "members",
        label: "Members",
        path: "members",
        requiredPermissions: ["tenant.membership.read"],
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        path: "roles",
        requiredPermissions: ["tenant.role.read"],
      },
    ],
  },
];
