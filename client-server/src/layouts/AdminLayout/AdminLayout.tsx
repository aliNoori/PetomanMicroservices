import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Header } from "./components/Header";
import { Sidebar, MobileSidebar } from "./components/Sidebar";
import { Content } from "./components/Content";

export function AdminLayout() {
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

        <Content>
          <Outlet />
        </Content>
      </div>
    </div>
  );
}
