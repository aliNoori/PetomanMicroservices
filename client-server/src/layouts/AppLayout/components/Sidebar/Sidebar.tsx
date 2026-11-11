import {
  NavigationContent,
} from "./NavigationContent";


/**
 * Primary desktop application navigation.
 *
 * The sidebar owns desktop container concerns only:
 * - Width
 * - Border
 * - Background
 * - Scrolling
 * - Padding
 *
 * Navigation rendering is delegated to
 * NavigationContent so the same navigation
 * can be reused by the mobile drawer.
 *
 * Non-responsibilities:
 * - Authentication.
 * - Authorization.
 * - Capability evaluation.
 * - Role evaluation.
 * - Tenant access decisions.
 */
export function Sidebar() {

  return (

    <aside
      className="
        hidden
        w-56
        shrink-0
        overflow-y-auto
        border-r
        border-border
        bg-surface
        p-3
        sm:w-60
        sm:p-4
        lg:w-64
        lg:block
      "
    >

      <NavigationContent />

    </aside>

  );

}