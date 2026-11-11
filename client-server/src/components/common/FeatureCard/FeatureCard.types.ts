import type { ReactNode } from "react";

/**
 * Public contract for the FeatureCard component.
 *
 * The component is intentionally presentation-focused and remains
 * stateless so it can be safely reused across marketing, dashboard,
 * onboarding, and documentation surfaces.
 */
export interface FeatureCardProps {
  /**
   * Primary heading rendered as the card title.
   */
  title: string;

  /**
   * Supporting description rendered below the title.
   */
  description: string;

  /**
   * Optional visual element displayed above the title.
   */
  icon?: ReactNode;

  /**
   * Optional additional class names merged into the root element.
   */
  className?: string;
}