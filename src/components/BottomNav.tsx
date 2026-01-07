import { Home, Eye, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Eye, label: "View", path: "/view" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-4 md:h-20 lg:justify-center lg:gap-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200",
                "hover:text-primary",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 md:h-10 md:w-10",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200 md:h-6 md:w-6",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium md:text-sm",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
