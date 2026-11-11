import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "@/theme";

function ThemeConsumer() {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="mode">{mode}</span>

      <span data-testid="resolved-theme">{resolvedTheme}</span>

      <button type="button" onClick={() => setMode("light")}>
        Light
      </button>

      <button type="button" onClick={() => setMode("dark")}>
        Dark
      </button>

      <button type="button" onClick={() => setMode("system")}>
        System
      </button>

      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

function renderThemeProvider() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  );
}

function mockSystemTheme(isDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQuery = {
    matches: isDark,

    media: "(prefers-color-scheme: dark)",

    onchange: null,

    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },

    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },

    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },

    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },

    dispatchEvent: () => true,
  } as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });

  return {
    mediaQuery,
    listeners,
  };
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();

    document.documentElement.classList.remove("dark");

    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");

    localStorage.clear();
  });

  it("defaults to system mode when no theme is stored", () => {
    mockSystemTheme(false);

    renderThemeProvider();

    expect(screen.getByTestId("mode")).toHaveTextContent("system");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("restores the persisted light mode", () => {
    localStorage.setItem("theme-mode", "light");

    mockSystemTheme(true);

    renderThemeProvider();

    expect(screen.getByTestId("mode")).toHaveTextContent("light");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("restores the persisted dark mode", () => {
    localStorage.setItem("theme-mode", "dark");

    mockSystemTheme(false);

    renderThemeProvider();

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light mode to the document", async () => {
    mockSystemTheme(true);

    renderThemeProvider();

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Light",
        })
        .click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("light");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    expect(localStorage.getItem("theme-mode")).toBe("light");
  });

  it("applies dark mode to the document", async () => {
    mockSystemTheme(false);

    renderThemeProvider();

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Dark",
        })
        .click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    expect(localStorage.getItem("theme-mode")).toBe("dark");
  });

  it("follows the system dark preference", () => {
    mockSystemTheme(true);

    renderThemeProvider();

    expect(screen.getByTestId("mode")).toHaveTextContent("system");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("responds to system preference changes", async () => {
    const { mediaQuery, listeners } = mockSystemTheme(false);

    renderThemeProvider();

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    Object.defineProperty(mediaQuery, "matches", {
      configurable: true,
      value: true,
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener({
          matches: true,
          media: mediaQuery.media,
        } as MediaQueryListEvent);
      });
    });

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles from light to dark", async () => {
    localStorage.setItem("theme-mode", "light");

    mockSystemTheme(false);

    renderThemeProvider();

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Toggle",
        })
        .click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
  });

  it("toggles from dark to light", async () => {
    localStorage.setItem("theme-mode", "dark");

    mockSystemTheme(true);

    renderThemeProvider();

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Toggle",
        })
        .click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("light");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("switches from system to the opposite resolved theme", async () => {
    mockSystemTheme(true);

    renderThemeProvider();

    expect(screen.getByTestId("mode")).toHaveTextContent("system");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Toggle",
        })
        .click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("light");

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme changes", async () => {
    mockSystemTheme(false);

    renderThemeProvider();

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Dark",
        })
        .click();
    });

    expect(localStorage.getItem("theme-mode")).toBe("dark");

    await act(async () => {
      screen
        .getByRole("button", {
          name: "Light",
        })
        .click();
    });

    expect(localStorage.getItem("theme-mode")).toBe("light");
  });
});
