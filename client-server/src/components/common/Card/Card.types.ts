import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

/**
 * Supported visual variants for the base Card component.
 */
export type CardVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "interactive";

/**
 * Supported Card spacing presets.
 */
export type CardPadding =
  | "none"
  | "sm"
  | "md"
  | "lg";

/**
 * Supported Card border-radius presets.
 */
export type CardRadius =
  | "sm"
  | "md"
  | "lg"
  | "xl";

/**
 * Supported semantic HTML elements for the Card root.
 */
export type CardElement = ElementType;

/**
 * Base props shared by the Card component.
 */
export interface CardBaseProps {
  /**
   * Visual presentation variant.
   */
  variant?: CardVariant;

  /**
   * Internal spacing preset.
   */
  padding?: CardPadding;

  /**
   * Border-radius preset.
   */
  radius?: CardRadius;

  /**
   * Enables hover elevation/interaction styling.
   */
  hoverable?: boolean;

  /**
   * Marks the Card as interactive.
   *
   * When true, the Card becomes keyboard accessible when an
   * onClick handler is provided.
   */
  clickable?: boolean;

  /**
   * Visually and semantically disables the Card.
   */
  disabled?: boolean;

  /**
   * Optional Card header content.
   */
  header?: ReactNode;

  /**
   * Optional Card footer content.
   */
  footer?: ReactNode;

  /**
   * Card body content.
   */
  children?: ReactNode;

  /**
   * Additional Tailwind/classes.
   */
  className?: string;
}

/**
 * Props for the default div-based Card.
 */
export type CardProps = CardBaseProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof CardBaseProps>;