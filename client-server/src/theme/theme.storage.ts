import {
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "./theme.types";

/**
 * Read the persisted theme mode from localStorage.
 *
 * The function is resilient to environments where
 * window or localStorage is not available.
 */
export function getStoredThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Persist the selected theme mode.
 *
 * Storage failures are intentionally ignored so
 * theme changes never block the user experience.
 */
export function setStoredThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Remove the persisted theme mode.
 *
 * Useful for future reset-to-default behavior.
 */
export function clearStoredThemeMode(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}