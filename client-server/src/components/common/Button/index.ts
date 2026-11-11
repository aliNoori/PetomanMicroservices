/**
 * Public entry point for the Button component.
 *
 * Keeping exports centralized provides a stable import boundary for
 * consumers and allows the internal Button implementation to evolve
 * without changing application-level import paths.
 */
export { Button } from "./Button";

export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "./Button.types";