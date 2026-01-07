import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/15 to-transparent" />
      {/* Bottom gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />
      
      <main className="relative flex-1 pb-20 md:pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
