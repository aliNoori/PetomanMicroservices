import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ThemeContext } from "./ThemeContext";

import { getStoredThemeMode, setStoredThemeMode } from "./theme.storage";

import type { ResolvedTheme, ThemeMode } from "./theme.types";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Resolve the system color scheme.
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolve the effective theme that should be applied
 * to the document.
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

/**
 * Apply the resolved theme to the document root.
 */
function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getStoredThemeMode() ?? "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredThemeMode() ?? "system"),
  );

  /**
   * Persist and apply theme whenever the selected mode changes.
   */
  useEffect(() => {
    const nextTheme = resolveTheme(mode);

    setResolvedTheme(nextTheme);

    applyTheme(nextTheme);

    setStoredThemeMode(mode);
  }, [mode]);

  /**
   * Follow operating system changes while the application
   * is in system mode.
   */
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const nextTheme = getSystemTheme();

      setResolvedTheme(nextTheme);

      applyTheme(nextTheme);
    };

    handleChange();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  /**
   * Toggle between light and dark.
   *
   * When the current mode is system,
   * the toggle switches based on the resolved theme.
   */
  const toggleTheme = useCallback(() => {
    setModeState((currentMode) => {
      if (currentMode === "system") {
        return resolvedTheme === "dark" ? "light" : "dark";
      }

      return currentMode === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
      toggleTheme,
    }),
    [mode, resolvedTheme, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
