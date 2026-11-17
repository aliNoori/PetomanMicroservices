import { createBrowserRouter, Navigate } from "react-router-dom";

import { VerifyEmailPage } from "@/pages/VerifyEmail";
import { CreateTenantPage } from "@/pages/Tenant";
import {
  AuthGuard,
  SystemRoleGuard,
  WorkspaceTenantGuard,
} from "@/features/auth";
import { ManageTenants } from "@/pages/Tenant/ManageTenants";

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
import { TenantPage } from "../pages/Tenant";

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
        element: <AppLayout />,
        children: [
          {
            path: "/admin/tenants/pending",
            element: <ManageTenants />,
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
                element: <ProductsPage />,
              },
              {
                path: "orders",
                element: <OrdersPage />,
              },
              {
                path: "members",
                element: <MembersPage />,
              },
              {
                path: "settings",
                element: <WorkspaceSettingsPage />,
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
