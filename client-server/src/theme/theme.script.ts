import {
  THEME_STORAGE_KEY,
} from "./theme.types";

import type {
  ThemeMode,
} from "./theme.types";

/**
 * Apply the initial theme before React mounts.
 *
 * This prevents a flash of incorrect theme
 * during the first render.
 */
export function applyInitialTheme(): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  const mode: ThemeMode =
    stored === "light" ||
    stored === "dark" ||
    stored === "system"
      ? stored
      : "system";

  const prefersDark =
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const resolved =
    mode === "system"
      ? (prefersDark ? "dark" : "light")
      : mode;

  document.documentElement.classList.toggle(
    "dark",
    resolved === "dark",
  );
}