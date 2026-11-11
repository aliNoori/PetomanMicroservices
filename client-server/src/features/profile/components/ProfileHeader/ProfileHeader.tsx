import type { ProfileUser } from "../../types";

interface ProfileHeaderProps {
  user: ProfileUser;
}

/**
 * Profile identity header.
 *
 * Displays the primary identity information
 * of the currently authenticated user.
 *
 * This component intentionally contains no
 * authentication or authorization logic.
 */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "User";

  return (
    <section className="border-b border-border pb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary">
          {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-text-primary">
            {fullName}
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            {user.email ?? "No email available"}
          </p>
        </div>
      </div>
    </section>
  );
}
