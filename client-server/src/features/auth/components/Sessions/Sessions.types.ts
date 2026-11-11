import type {
  AuthSession,
} from "@/features/auth";


/**
 * Sessions component contract.
 *
 * The component receives session state and actions
 * from the useSessions hook.
 *
 * API communication and session lifecycle remain
 * outside the presentation component.
 */
export interface SessionsProps {

  sessions: AuthSession[];
  loading: boolean;
  error: string | null;
  revokingSessionId: string | null;
  deletingSessionId: string | null;
  onRevoke: (sessionId: string) => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;

}