import {
  useContext,
} from "react";

import {
  ThemeContext,
} from "./ThemeContext";

import type {
  ThemeContextValue,
} from "./theme.types";

/**
 * Access the application theme context.
 *
 * This hook must be used inside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error(
      "useTheme must be used within ThemeProvider.",
    );
  }

  return context;
}