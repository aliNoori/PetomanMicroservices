
import { NavigationContent } from "./NavigationContent";

export function Sidebar() {
  return (
    <aside
      aria-label="Workspace sidebar"
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
