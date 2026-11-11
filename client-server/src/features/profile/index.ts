/**
 * Profile feature public API.
 *
 * External modules should consume profile functionality
 * through this entry point instead of importing internal
 * implementation files directly.
 */


// Components
export {
  ProfileHeader,
  ProfileSummary,
} from "./components";


// Component contracts
export type {
  ProfileSummaryProps,
} from "./components";


// Types
export type {
  ProfileUser,
} from "./types";

export {
  useSessions,
} from "../auth";

export type {
  UseSessionsResult,
} from "../auth";