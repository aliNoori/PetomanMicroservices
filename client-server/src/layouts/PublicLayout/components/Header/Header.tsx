import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "@/features/auth";

// Use the same production UserMenu that AppLayout uses.
import {
  UserMenu,
} from "@/layouts/AppLayout/components/Header/UserMenu";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-surface px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">
          MultiStack Engineering Platform
        </h1>

        {user ? (
          <UserMenu />
        ) : (
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-surface-secondary"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}