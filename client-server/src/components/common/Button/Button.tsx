import { forwardRef } from "react";

import type { ButtonProps } from "./Button.types";
import {
  buttonBaseClasses,
  buttonFullWidthClass,
  buttonSizeClasses,
  buttonVariantClasses,
} from "./Button.variants";

/**
 * Minimal loading indicator used by the Button.
 *
 * The spinner is intentionally implemented without an external icon
 * dependency to keep the foundational component lightweight.
 */
function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className={[
        "size-4",
        "animate-spin",
        "rounded-full",
        "border-2",
        "border-current",
        "border-t-transparent",
        "motion-reduce:animate-none",
      ].join(" ")}
    />
  );
}

/**
 * Visually hidden status text for assistive technologies.
 *
 * The visual spinner alone does not communicate the loading state
 * reliably to screen-reader users, so an explicit status is provided.
 */
function LoadingStatus() {
  return <span className="sr-only">Loading</span>;
}

/**
 * Production-ready design-system Button.
 *
 * The component intentionally remains a native HTML button at its core,
 * preserving browser semantics and compatibility with standard button
 * attributes while exposing a strongly typed visual API.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      className = "",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    const classes = [
      buttonBaseClasses,
      buttonVariantClasses[variant],
      buttonSizeClasses[size],
      fullWidth ? buttonFullWidthClass : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        <span
          className={[
            "inline-flex",
            "items-center",
            "justify-center",
            "gap-2",
            loading ? "invisible" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {leftIcon}

          <span>{children}</span>

          {rightIcon}
        </span>

        {loading && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <ButtonSpinner />
          </span>
        )}

        {loading && <LoadingStatus />}
      </button>
    );
  },
);

Button.displayName = "Button";
