import type { ButtonSize, ButtonVariant } from "./Button.types";

/**
 * Base interaction and layout styles shared by every Button variant.
 *
 * The base layer establishes consistent geometry, typography,
 * focus behavior, motion, and disabled-state semantics.
 */
export const buttonBaseClasses = [
  "relative",
  "inline-flex",
  "items-center",
  "justify-center",
  "gap-2",
  "whitespace-nowrap",
  "select-none",
  "rounded-lg",
  "font-medium",
  "leading-none",

  // Smooth, GPU-friendly interaction transitions.
  "transition-[transform,background-color,border-color,box-shadow,color,opacity]",
  "duration-200",
  "ease-out",
  "will-change-transform",

  // Keyboard accessibility.
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-primary/40",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-background",

  // Disabled interaction.
  "disabled:pointer-events-none",
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",

  // Prevent text selection during interaction.
  "active:select-none",

  // Respect users who prefer reduced motion.
  "motion-reduce:transition-none",
  "motion-reduce:transform-none",
].join(" ");

/**
 * Semantic visual variants for the Button.
 *
 * Variants communicate action intent while delegating actual colors
 * to the application's semantic design tokens.
 */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary",
    "text-text-inverse",
    "border",
    "border-transparent",

    "shadow-sm",

    "hover:-translate-y-px",
    "hover:bg-primary-hover",
    "hover:shadow-md",

    "active:translate-y-0",
    "active:shadow-sm",
  ].join(" "),

  secondary: [
    "bg-surface",
    "text-text-primary",
    "border",
    "border-border",

    "shadow-sm",

    "hover:-translate-y-px",
    "hover:bg-surface-elevated",
    "hover:border-border-strong",
    "hover:shadow-md",

    "active:translate-y-0",
    "active:shadow-sm",
  ].join(" "),

  outline: [
    "bg-transparent",
    "text-text-primary",
    "border",
    "border-border-strong",

    "hover:-translate-y-px",
    "hover:bg-surface",
    "hover:border-primary",
    "hover:text-primary",

    "active:translate-y-0",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-text-secondary",
    "border",
    "border-transparent",

    "hover:bg-surface",
    "hover:text-text-primary",

    "active:bg-background",
  ].join(" "),

  danger: [
    "bg-danger",
    "text-text-inverse",
    "border",
    "border-transparent",

    "shadow-sm",

    "hover:-translate-y-px",
    "hover:opacity-90",
    "hover:shadow-md",

    "active:translate-y-0",
    "active:shadow-sm",
  ].join(" "),
};

/**
 * Size presets define the Button's geometry and typography.
 *
 * Dimensions are intentionally constrained to a small scale to keep
 * the component visually consistent throughout the application.
 */
export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: ["h-9", "px-3.5", "text-xs"].join(" "),

  md: ["h-10", "px-4", "text-sm"].join(" "),

  lg: ["h-11", "px-5", "text-base"].join(" "),
};

/**
 * Full-width layout behavior.
 */
export const buttonFullWidthClass = "w-full";
