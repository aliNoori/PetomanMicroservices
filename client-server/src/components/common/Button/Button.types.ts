import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/**
 * Visual variants supported by the design-system Button.
 *
 * Variants describe semantic intent rather than specific visual properties.
 * This keeps component usage consistent while allowing the underlying
 * design tokens to evolve independently.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

/**
 * Supported Button size presets.
 *
 * Size tokens are intentionally constrained to a small, predictable set
 * to maintain visual consistency across the application.
 */
export type ButtonSize =
  | "sm"
  | "md"
  | "lg";

/**
 * Public API contract for the Button component.
 *
 * Extending the native HTML button attributes ensures that the component
 * remains compatible with standard browser behavior and accessibility
 * attributes while providing a strongly typed design-system API.
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Semantic visual variant of the Button.
   *
   * @default "primary"
   */
  variant?: ButtonVariant;

  /**
   * Controls the Button's size preset.
   *
   * @default "md"
   */
  size?: ButtonSize;

  /**
   * Indicates that an asynchronous action is currently in progress.
   *
   * Implementations should prevent duplicate interactions while loading
   * and provide an accessible loading indication.
   *
   * @default false
   */
  loading?: boolean;

  /**
   * Makes the Button expand to fill the available horizontal space.
   *
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Optional content rendered before the Button label.
   *
   * Typically used for icons or compact visual indicators.
   */
  leftIcon?: ReactNode;

  /**
   * Optional content rendered after the Button label.
   *
   * Typically used for directional icons or action indicators.
   */
  rightIcon?: ReactNode;
}