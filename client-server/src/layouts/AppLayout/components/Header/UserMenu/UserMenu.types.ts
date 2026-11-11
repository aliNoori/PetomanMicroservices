import type {
  ReactNode,
} from "react";


/**
 * UserMenu component contract.
 *
 * The foundation intentionally keeps the public API
 * minimal so authentication and navigation concerns
 * remain outside the component itself.
 */
export interface UserMenuProps {

  /**
   * Optional custom trigger content.
   *
   * This allows the visual trigger to evolve
   * without changing the UserMenu architecture.
   */
  children?: ReactNode;

}