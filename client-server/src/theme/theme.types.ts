/**
 * Available theme modes exposed to the application.
 *
 * - light: Always use the light theme.
 * - dark: Always use the dark theme.
 * - system: Follow the operating system preference.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * The actual visual theme currently applied to the document.
 *
 * This value is always resolved to either light or dark,
 * even when the selected mode is system.
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Theme context contract shared across the application.
 */
export interface ThemeContextValue {
  /**
   * User-selected theme mode.
   */
  mode: ThemeMode;

  /**
   * Theme currently applied to the document.
   */
  resolvedTheme: ResolvedTheme;

  /**
   * Update the active theme mode.
   */
  setMode: (mode: ThemeMode) => void;

  /**
   * Convenience toggle between light and dark.
   *
   * When the current mode is system,
   * the toggle switches based on the resolved theme.
   */
  toggleTheme: () => void;
}

/**
 * Storage key used for persisting the selected theme mode.
 */
export const THEME_STORAGE_KEY = "theme-mode";