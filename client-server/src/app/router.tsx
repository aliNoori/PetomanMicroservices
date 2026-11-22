import { createBrowserRouter, Navigate } from "react-router-dom";

import { VerifyEmailPage } from "@/pages/VerifyEmail";
import { CreateTenantPage } from "@/pages/Tenant";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  AuthGuard,
  SystemRoleGuard,
  WorkspaceTenantGuard,
  PermissionGuard,
} from "@/features/auth";
import { PendingTenantsPage } from "@/pages/Admin/Tenants/Pending";

import {
  ProfilePage,
  SettingsLayout,
  SettingsPage,
  SessionsPage,
  ChangePasswordPage,
} from "../pages/Profile";

import { LoginPage } from "../pages/Login";
import { RegisterPage } from "@/pages/Register";
import { ErrorPage } from "../pages/Error";
import { ForbiddenPage } from "../pages/Forbidden";
import { HomePage } from "../pages/Home";
import { NotFoundPage } from "../pages/NotFound";
import { TenantPage, MyWorkspacesPage } from "../pages/Tenant";

import { AppLayout } from "@/layouts/AppLayout";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

import { TenantSelectionPage } from "@/pages/Tenant/TenantSelectionPage";

import {
  DashboardPage,
  ProductsPage,
  OrdersPage,
  WorkspaceSettingsPage,
  MembersPage,
} from "@/pages/Workspace";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "/:tenantType",
        element: <TenantPage />,
      },
      {
        path: "/:tenantType/:tenantSlug",
        element: <TenantPage />,
      },
    ],
  },

  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/auth/select-tenant",
    element: <TenantSelectionPage />,
  },

  {
    element: <SystemRoleGuard requiredRole="SUPER_ADMIN" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/admin/tenants/pending",
            element: <PendingTenantsPage />,
          },
        ],
      },
    ],
  },

  {
    element: <AuthGuard />,
    children: [
      {
        path: "/workspace/:tenantId",
        element: <WorkspaceTenantGuard />,
        children: [
          {
            element: <WorkspaceLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="dashboard" replace />,
              },
              {
                path: "dashboard",
                element: <DashboardPage />,
              },
              {
                path: "products",
                element: (
                  <PermissionGuard requiredPermissions={["product.read"]}>
                    <ProductsPage />
                  </PermissionGuard>
                ),
              },
              {
                path: "orders",
                element: (
                  <PermissionGuard requiredPermissions={["order.read"]}>
                    <OrdersPage />
                  </PermissionGuard>
                ),
              },
              {
                path: "members",
                element: (
                  <PermissionGuard
                    requiredPermissions={["tenant.membership.read"]}
                  >
                    <MembersPage />
                  </PermissionGuard>
                ),
              },
              {
                path: "settings",
                element: (
                  <PermissionGuard requiredPermissions={["tenant.update"]}>
                    <WorkspaceSettingsPage />
                  </PermissionGuard>
                ),
              },
            ],
          },
        ],
      },

      {
        element: <AppLayout />,
        children: [
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/my-workspaces",
            element: <MyWorkspacesPage />,
          },
          {
            path: "/tenants/create",
            element: <CreateTenantPage />,
          },
          {
            path: "/profile/settings",
            element: <SettingsLayout />,
            children: [
              {
                index: true,
                element: <SettingsPage />,
              },
              {
                path: "change-password",
                element: <ChangePasswordPage />,
              },
              {
                path: "sessions",
                element: <SessionsPage />,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    path: "/403",
    element: <ForbiddenPage />,
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);

