import type {
  AuthUser,
} from "@/features/auth";


/**
 * Profile view model.
 *
 * The profile feature currently consumes the authenticated
 * user identity provided by the auth feature.
 *
 * Feature-specific profile data can be introduced here
 * later without coupling the UI directly to API responses.
 */
export type ProfileUser = AuthUser;