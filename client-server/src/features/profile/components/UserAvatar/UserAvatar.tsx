
import { useEffect, useState } from "react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function UserAvatar({
  avatarUrl,
  fallback,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !imageError;

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-primary-soft font-semibold text-primary",
        sizeClasses[size],
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
