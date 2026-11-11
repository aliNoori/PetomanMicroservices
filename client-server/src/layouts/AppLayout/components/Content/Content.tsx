import type {
  ReactNode,
} from "react";


import {
  Outlet,
} from "react-router-dom";


interface ContentProps {

  children?: ReactNode;

}


/**
 * Main application content container.
 *
 * This component is responsible for rendering
 * nested route content inside the application shell.
 *
 * The Outlet component allows React Router
 * to inject matched child routes dynamically.
 *
 * Feature pages should not know about the layout.
 * They only render inside this content area.
 *
 * Responsive behavior:
 * - Compact padding on mobile devices.
 * - Increased spacing on larger viewports.
 * - Prevent horizontal overflow from affecting
 *   the application shell.
 */
export function Content(
  {
    children,
  }: ContentProps,
) {

  return (

    <main
      className="
        min-w-0
        flex-1
        overflow-x-hidden
        p-4
        sm:p-5
        lg:p-6
      "
    >

      {
        children ?? <Outlet />
      }

    </main>

  );

}