import type {
  CardPadding,
  CardRadius,
  CardVariant,
} from "./Card.types";

/**
 * Maps Card variants to semantic design-token classes.
 */
export const cardVariantClasses: Record<
  CardVariant,
  string
> = {
  default:
    "border border-border bg-surface-elevated shadow-sm",

  elevated:
    "border border-border bg-surface-elevated shadow-md",

  outlined:
    "border border-border bg-surface",

  interactive:
    "border border-border bg-surface-elevated shadow-sm",
};

/**
 * Maps Card padding presets to spacing tokens.
 */
export const cardPaddingClasses: Record<
  CardPadding,
  string
> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

/**
 * Maps Card radius presets to radius classes.
 */
export const cardRadiusClasses: Record<
  CardRadius,
  string
> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
};