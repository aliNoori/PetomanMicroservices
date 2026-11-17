
import type { ReactNode } from "react";

interface ContentProps {
  children: ReactNode;
}

export function Content({ children }: ContentProps) {
  return (
    <main
      id="workspace-main-content"
      className="
        min-w-0
        flex-1
        overflow-y-auto
        bg-background
        p-4
        sm:p-6
        lg:p-8
      "
    >
      {children}
    </main>
  );
}
