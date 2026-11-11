import {
  useAuth,
} from "@/features/auth";


import {
  ProfileSummary,
} from "@/features/profile";


/**
 * Account settings page.
 *
 * This page represents the default
 * account section of Profile Settings.
 *
 * SettingsLayout owns the navigation shell,
 * while this page owns account-specific content.
 */
export function SettingsPage() {

  const {
    user,
  } = useAuth();


  if (!user) {

    return null;

  }


  return (

    <section
      className="
        rounded-xl
        border
        border-border
        bg-surface
        p-6
      "
    >


      <div>

        <h2 className="text-lg font-semibold text-text-primary">

          Account Settings

        </h2>


        <p className="mt-1 text-sm text-text-secondary">

          Manage your account information and preferences.

        </p>

      </div>



      <div className="mt-6">

        <ProfileSummary
          user={user}
        />

      </div>


    </section>

  );

}