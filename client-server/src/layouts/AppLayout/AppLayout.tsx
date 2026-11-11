import {
  useState,
  type ReactNode,
} from "react";


import {
  Header,
} from "./components/Header";


import {
  Sidebar,
  MobileSidebar,
} from "./components/Sidebar";


import {
  Content,
} from "./components/Content";


import type {
  AppLayoutProps,
} from "./AppLayout.types";


/**
 * Application shell layout.
 *
 * This component owns global application structure
 * and responsive navigation state.
 *
 * Responsibilities:
 * - Provide consistent page structure.
 * - Compose global UI sections.
 * - Own mobile navigation state.
 * - Coordinate Header and MobileSidebar.
 * - Host nested routes through Content.
 *
 * Non-responsibilities:
 * - Authentication logic.
 * - User profile management.
 * - Permissions and authorization rules.
 * - Feature-specific state.
 */
export function AppLayout(
  {
    children,
  }: AppLayoutProps,
) {

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);


  const openMobileSidebar = () => {

    setMobileSidebarOpen(true);

  };


  const closeMobileSidebar = () => {

    setMobileSidebarOpen(false);

  };


  return (

    <div
      className="
        min-h-screen
        bg-background
        text-text-primary
      "
    >

      {/* Global application header */}
      <Header
        onMenuOpen={openMobileSidebar}
      />


      {/* Mobile navigation drawer */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={closeMobileSidebar}
      />


      <div className="flex min-h-[calc(100vh-4rem)]">

        {/* Primary desktop navigation */}
        <Sidebar />


        {/* Route content container */}
        <Content>

          {children}

        </Content>

      </div>

    </div>

  );

}