import {
  useContext,
} from "react";


import {
  AuthContext,
} from "../context";


import type {
  AuthContextValue,
} from "../context";



/**
 * Access authentication state and actions.
 *
 * This hook is the single entry point for auth consumers.
 * Components should not access AuthContext directly.
 *
 * Future extensions:
 * - permissions
 * - capabilities
 * - roles
 * - tenant access
 */
export function useAuth(): AuthContextValue {

  const context =
    useContext(
      AuthContext,
    );



  if (context === null) {

    throw new Error(
      "useAuth must be used within AuthProvider",
    );

  }



  return context;

}