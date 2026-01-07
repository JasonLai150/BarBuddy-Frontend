import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-20 md:pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
