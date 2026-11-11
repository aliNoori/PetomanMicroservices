import {
  createContext,
} from "react";

import type {
  ThemeContextValue,
} from "./theme.types";

/**
 * Theme context shared across the application.
 *
 * The default value is intentionally null so
 * useTheme can detect incorrect usage outside
 * of ThemeProvider.
 */
export const ThemeContext =
  createContext<ThemeContextValue | null>(null);