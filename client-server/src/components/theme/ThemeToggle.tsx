import {
  useTheme,
} from "@/theme";


/**
 * Compact theme toggle.
 *
 * Provides a lightweight two-state theme switcher
 * for the global application header.
 *
 * Behavior:
 * - Light mode → shows Moon icon and switches to Dark.
 * - Dark mode → shows Sun icon and switches to Light.
 *
 * System mode is intentionally resolved to the current
 * visual theme so the header always presents a clear
 * Light / Dark interaction.
 */
export function ThemeToggle() {

  const {
    mode,
    setMode,
  } = useTheme();


  /**
   * Treat system mode according to the user's
   * current browser preference.
   */
  const prefersDark =
    window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches ?? false;


  const isDark =
    mode === "dark" ||
    (
      mode === "system" &&
      prefersDark
    );


  const nextMode =
    isDark
      ? "light"
      : "dark";


  const label =
    isDark
      ? "Switch to light theme"
      : "Switch to dark theme";


  return (

    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setMode(nextMode)}
      className="
        inline-flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        border-border
        bg-surface
        text-text-secondary
        shadow-sm
        transition-all
        duration-200
        hover:bg-surface-secondary
        hover:text-text-primary
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary
        focus-visible:ring-offset-2
        focus-visible:ring-offset-surface
        active:scale-95
        sm:h-10
        sm:w-10
      "
    >

      {isDark ? (

        /* Sun icon */

        <svg
          className="h-4 w-4 sm:h-5 sm:w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >

          <circle
            cx="12"
            cy="12"
            r="4"
          />

          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />

        </svg>

      ) : (

        /* Moon icon */

        <svg
          className="h-4 w-4 sm:h-5 sm:w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >

          <path
            d="
              M21 12.79
              A9 9 0 1 1
              11.21 3
              7 7 0 0 0
              21 12.79z
            "
          />

        </svg>

      )}

    </button>

  );

}
