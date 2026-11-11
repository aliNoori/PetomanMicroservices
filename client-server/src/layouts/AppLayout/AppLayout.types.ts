/**
 * Application layout component contract.
 *
 * This type is intentionally kept minimal because
 * the layout should only handle application structure.
 *
 * Business logic, user data, permissions, and feature-specific
 * concerns should remain inside their own domains.
 */
export interface AppLayoutProps {
  children?: React.ReactNode;
}