import type {
  ProfileSummaryProps,
} from "./ProfileSummary.types";


/**
 * Profile summary information.
 *
 * Displays account information that is currently
 * available from the authenticated user model.
 *
 * Additional account metadata can be introduced
 * without changing the application layout.
 */
export function ProfileSummary(
  {
    user,
  }: ProfileSummaryProps,
) {


  return (

    <section className="rounded-lg border border-border bg-surface p-6">


      <h2 className="text-lg font-semibold text-text-primary">

        Account Information

      </h2>


      <div className="mt-6 grid gap-5 sm:grid-cols-2">


        <div>

          <p className="text-xs font-medium uppercase text-text-muted">

            Email

          </p>

          <p className="mt-1 text-sm text-text-primary">

            {user.email}

          </p>

        </div>



        <div>

          <p className="text-xs font-medium uppercase text-text-muted">

            Account Status

          </p>

          <p className="mt-1 text-sm text-text-primary">

            {user.isActive}

          </p>

        </div>



        <div>

          <p className="text-xs font-medium uppercase text-text-muted">

            Email Verification

          </p>

          <p className="mt-1 text-sm text-text-primary">

            {user.emailVerifiedAt
              ? "Verified"
              : "Not verified"}

          </p>

        </div>



        <div>

          <p className="text-xs font-medium uppercase text-text-muted">

            Member Since

          </p>

          <p className="mt-1 text-sm text-text-primary">

            {
              new Date(
                user.createdAt,
              ).toLocaleDateString()
            }

          </p>

        </div>


      </div>


    </section>

  );

}