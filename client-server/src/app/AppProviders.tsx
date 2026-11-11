import type {
  ReactNode,
} from "react";


import {
  ThemeProvider,
} from "@/theme";


import {
  AuthProvider,
} from "@/features/auth";


interface AppProvidersProps {

  children: ReactNode;

}


/**
 * Application composition layer.
 *
 * All global providers should be registered here.
 *
 * Providers are intentionally composed at the
 * application boundary to keep feature modules
 * independent from global application concerns.
 */
export function AppProviders(
  {
    children,
  }: AppProvidersProps,
) {

  return (

    <ThemeProvider>

      <AuthProvider>

        {children}

      </AuthProvider>

    </ThemeProvider>

  );

}