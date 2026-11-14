import { useEffect, useState } from "react";
import type { ProfileUser } from "../../types";

interface ProfileHeaderProps {
  user: ProfileUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user.avatarUrl]);

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "User";

  const fallbackInitial =
    user.firstName?.charAt(0) || user.email?.charAt(0) || "U";

  const showAvatar = Boolean(user.avatarUrl) && !imageError;

  return (
    <section className="border-b border-border pb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xl font-semibold text-primary">
          {showAvatar ? (
            <img
              src={user.avatarUrl!}
              alt={`${fullName} avatar`}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            fallbackInitial
          )}
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
