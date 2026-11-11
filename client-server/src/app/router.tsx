import { createBrowserRouter, Navigate } from "react-router-dom";
import { VerifyEmailPage } from "@/pages/VerifyEmail";
import { CreateTenantPage } from "@/pages/Tenant";
import { SystemRoleGuard } from "@/features/auth";
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

import { AuthGuard } from "@/features/auth";

import { AppLayout } from "@/layouts/AppLayout";

import { PublicLayout } from "@/layouts/PublicLayout";
import { TenantSelectionPage } from "@/pages/Tenant/TenantSelectionPage";

export const router = createBrowserRouter([
  /**
   * Public application routes.
   *
   * These pages are accessible without authentication.
   *
   * PublicLayout provides:
   * - Public header
   * - Public page container
   */
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

      /**
       * Tenant discovery page.
       *
       * Examples:
       * /market
       * /vets
       * /pharmacy
       *
       * TenantPage receives the tenant type
       * through the URL parameter.
       */
      {
        path: "/:tenantType",

        element: <TenantPage />,
      },

      /**
       * Specific tenant page.
       *
       * Examples:
       * /market/my-shop
       * /vets/dr-ali
       * /pharmacy/central-pharmacy
       *
       * TenantPage receives both:
       * - tenantType
       * - tenantSlug
       */
      {
        path: "/:tenantType/:tenantSlug",

        element: <TenantPage />,
      },
    ],
  },

  /**
   * Authentication entry point.
   *
   * Login does not use application shell
   * because it belongs to the authentication experience.
   */
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

  /**
   * System administration routes.
   *
   * These routes require an active login session
   * and a specific system-level role.
   *
   * Tenant selection is not required.
   */
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

  /**
   * Protected application routes.
   *
   * AuthGuard validates the current session.
   *
   * AppLayout provides the private application shell:
   * - Application header
   * - Sidebar navigation
   * - Content container
   */
  {
    element: <AuthGuard />,

    children: [
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

          /**
           * Profile settings route boundary.
           *
           * SettingsLayout owns the settings navigation
           * and renders nested settings routes through Outlet.
           */
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

          // Future authenticated routes:
          // /products
          // /orders
        ],
      },
    ],
  },

  /**
   * Forbidden access page.
   */
  {
    path: "/403",

    element: <ForbiddenPage />,
  },

  /**
   * Not found page.
   */
  {
    path: "/404",

    element: <NotFoundPage />,
  },

  /**
   * Fallback route.
   *
   * Redirect unknown routes
   * to the not found page.
   */
  {
    path: "*",

    element: <Navigate to="/404" replace />,
  },
]);
