import type { KeyboardEvent } from "react";

import type { CardProps } from "./Card.types";
import {
  cardPaddingClasses,
  cardRadiusClasses,
  cardVariantClasses,
} from "./Card.variants";

/**
 * Base reusable Card primitive.
 *
 * The Card intentionally contains no business logic.
 * Domain-specific components such as ProductCard and PostCard
 * can compose this primitive without coupling the base component
 * to marketplace or content concerns.
 */
export function Card({
  variant = "default",
  padding = "md",
  radius = "lg",
  hoverable = false,
  clickable = false,
  disabled = false,
  header,
  footer,
  children,
  className = "",
  onClick,
  ...rest
}: CardProps) {
  /**
   * A Card becomes keyboard-interactive only when both
   * clickable behavior and an onClick handler are provided.
   */
  const isInteractive =
    clickable &&
    Boolean(onClick) &&
    !disabled;

  /**
   * Handles keyboard activation for interactive Cards.
   *
   * Enter and Space provide expected keyboard behavior
   * for button-like interactive surfaces.
   */
  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!isInteractive || !onClick) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onClick(
        event as unknown as React.MouseEvent<HTMLDivElement>,
      );
    }
  };

  const classes = [
    "overflow-hidden",
    "transition-[transform,box-shadow,border-color]",
    "duration-200 ease-out",

    cardVariantClasses[variant],
    cardPaddingClasses[padding],
    cardRadiusClasses[radius],

    hoverable && !disabled
      ? "hover:-translate-y-0.5 hover:shadow-md"
      : "",

    isInteractive
      ? [
          "cursor-pointer",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-primary/40",
          "focus-visible:ring-offset-2",
        ].join(" ")
      : "",

    disabled
      ? "pointer-events-none opacity-60"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...rest}
      className={classes}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={
        isInteractive
          ? "button"
          : rest.role
      }
      tabIndex={
        isInteractive
          ? 0
          : rest.tabIndex
      }
      aria-disabled={
        disabled
          ? true
          : rest["aria-disabled"]
      }
    >
      {header && (
        <div className="border-b border-border">
          {header}
        </div>
      )}

      {children}

      {footer && (
        <div className="border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}