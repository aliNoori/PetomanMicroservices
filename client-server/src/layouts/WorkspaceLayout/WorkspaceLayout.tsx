
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { MobileSidebar } from "./components/Sidebar/MobileSidebar";
import { Content } from "./components/Content/Content";

import type { WorkspaceLayoutProps } from "./WorkspaceLayout.types";

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header onMenuOpen={openMobileSidebar} />

      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />

        <Content>{children ?? <Outlet />}</Content>
      </div>
    </div>
  );
}
