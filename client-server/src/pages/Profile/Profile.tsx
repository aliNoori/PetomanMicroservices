import {
  NavLink,
} from "react-router-dom";


import {
  useAuth,
} from "@/features/auth";


import {
  ProfileHeader,
  ProfileSummary,
} from "@/features/profile";


/**
 * Profile page composition.
 *
 * This page connects authenticated user identity
 * with the profile feature components.
 *
 * Authentication state remains owned by AuthProvider.
 * The page only consumes the public auth contract.
 */
export function ProfilePage() {

  const {
    user,
  } = useAuth();


  if (!user) {

    return null;

  }


  return (

    <div className="mx-auto w-full max-w-5xl space-y-8">


      {/* Profile header */}
      <ProfileHeader
        user={user}
      />


      {/* Profile navigation */}
      <nav
        aria-label="Profile navigation"
        className="
          flex
          gap-1
          border-b
          border-border
        "
      >

        <NavLink
          to="/profile"
          end
          className={({ isActive }) =>
            [
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",

              "focus:outline-none focus:ring-2 focus:ring-primary/30",

              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")
          }
        >

          Profile

        </NavLink>


        <NavLink
          to="/profile/settings"
          className={({ isActive }) =>
            [
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",

              "focus:outline-none focus:ring-2 focus:ring-primary/30",

              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")
          }
        >

          Settings

        </NavLink>

      </nav>


      {/* Profile information */}
      <ProfileSummary
        user={user}
      />


    </div>

  );

}