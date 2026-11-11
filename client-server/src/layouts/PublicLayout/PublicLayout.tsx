import type {
  ReactNode,
} from "react";


import {
  Outlet,
} from "react-router-dom";


import {
  Header,
} from "./components/Header";


interface PublicLayoutProps {

  children?: ReactNode;

}


/**
 * Public application layout.
 *
 * This shell is used for unauthenticated pages.
 *
 * Responsibilities:
 * - Provide public page structure.
 * - Render public navigation.
 * - Host nested public routes.
 *
 * It should not contain:
 * - Authentication logic.
 * - User information.
 * - Private application navigation.
 */
export function PublicLayout(
  {
    children,
  }: PublicLayoutProps,
) {


  return (

    <div className="min-h-screen bg-background text-text-primary">


      <Header />


      <main>

        {
          children ?? <Outlet />
        }

      </main>


    </div>

  );

}