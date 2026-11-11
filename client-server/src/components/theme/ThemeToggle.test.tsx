import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  ThemeProvider,
  useTheme,
} from "@/theme";

import {
  ThemeToggle,
} from "./ThemeToggle";


function ThemeState() {
  const {
    mode,
    resolvedTheme,
  } = useTheme();

  return (
    <div>
      <span data-testid="mode">
        {mode}
      </span>

      <span data-testid="resolved-theme">
        {resolvedTheme}
      </span>
    </div>
  );
}


function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />

      <ThemeState />
    </ThemeProvider>,
  );
}


function mockSystemTheme(
  isDark: boolean,
) {
  const listeners = new Set<
    (event: MediaQueryListEvent) => void
  >();

  const mediaQuery = {
    matches: isDark,

    media: "(prefers-color-scheme: dark)",

    onchange: null,

    addEventListener: (
      _type: string,
      listener: (
        event: MediaQueryListEvent,
      ) => void,
    ) => {
      listeners.add(listener);
    },

    removeEventListener: (
      _type: string,
      listener: (
        event: MediaQueryListEvent,
      ) => void,
    ) => {
      listeners.delete(listener);
    },

    addListener: () => undefined,

    removeListener: () => undefined,

    dispatchEvent: () => true,
  } as unknown as MediaQueryList;

  Object.defineProperty(
    window,
    "matchMedia",
    {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(
        mediaQuery,
      ),
    },
  );

  return {
    mediaQuery,
    listeners,
  };
}


describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();

    document.documentElement.classList.remove(
      "dark",
    );

    vi.restoreAllMocks();
  });


  afterEach(() => {
    cleanup();

    document.documentElement.classList.remove(
      "dark",
    );

    localStorage.clear();

    vi.restoreAllMocks();
  });


  it("renders the theme toggle button", () => {
    mockSystemTheme(false);

    renderThemeToggle();

    expect(
      screen.getByRole("button"),
    ).toBeInTheDocument();
  });


  it("shows the dark theme action when the resolved theme is light", () => {
    mockSystemTheme(false);

    renderThemeToggle();

    expect(
      screen.getByRole("button", {
        name: "Switch to dark theme",
      }),
    ).toBeInTheDocument();
  });


  it("shows the light theme action when the resolved theme is dark", () => {
    mockSystemTheme(true);

    renderThemeToggle();

    expect(
      screen.getByRole("button", {
        name: "Switch to light theme",
      }),
    ).toBeInTheDocument();
  });


  it("uses system mode by default", () => {
    mockSystemTheme(false);

    renderThemeToggle();

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("system");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("light");
  });


  it("resolves system mode to dark when the system prefers dark", () => {
    mockSystemTheme(true);

    renderThemeToggle();

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("system");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("dark");
  });


  it("switches from system light to dark mode", async () => {
    mockSystemTheme(false);

    const user = userEvent.setup();

    renderThemeToggle();

    const button =
      screen.getByRole("button", {
        name: "Switch to dark theme",
      });

    await user.click(button);

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("dark");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("dark");

    expect(
      document.documentElement.classList.contains(
        "dark",
      ),
    ).toBe(true);

    expect(
      localStorage.getItem("theme-mode"),
    ).toBe("dark");

    expect(
      screen.getByRole("button", {
        name: "Switch to light theme",
      }),
    ).toBeInTheDocument();
  });


  it("switches from system dark to light mode", async () => {
    mockSystemTheme(true);

    const user = userEvent.setup();

    renderThemeToggle();

    const button =
      screen.getByRole("button", {
        name: "Switch to light theme",
      });

    await user.click(button);

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("light");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("light");

    expect(
      document.documentElement.classList.contains(
        "dark",
      ),
    ).toBe(false);

    expect(
      localStorage.getItem("theme-mode"),
    ).toBe("light");

    expect(
      screen.getByRole("button", {
        name: "Switch to dark theme",
      }),
    ).toBeInTheDocument();
  });


  it("toggles between dark and light modes", async () => {
    mockSystemTheme(false);

    const user = userEvent.setup();

    renderThemeToggle();

    let button =
      screen.getByRole("button", {
        name: "Switch to dark theme",
      });

    await user.click(button);

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("dark");

    button =
      screen.getByRole("button", {
        name: "Switch to light theme",
      });

    await user.click(button);

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("light");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("light");

    expect(
      document.documentElement.classList.contains(
        "dark",
      ),
    ).toBe(false);

    expect(
      localStorage.getItem("theme-mode"),
    ).toBe("light");
  });


  it("restores the persisted dark theme mode", () => {
    mockSystemTheme(false);

    localStorage.setItem(
      "theme-mode",
      "dark",
    );

    renderThemeToggle();

    expect(
      screen.getByTestId("mode"),
    ).toHaveTextContent("dark");

    expect(
      screen.getByTestId("resolved-theme"),
    ).toHaveTextContent("dark");

    expect(
      document.documentElement.classList.contains(
        "dark",
      ),
    ).toBe(true);

    expect(
      screen.getByRole("button", {
        name: "Switch to light theme",
      }),
    ).toBeInTheDocument();
  });
});