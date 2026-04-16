import { useLocation, Link, useNavigate } from "react-router-dom";
import { Scale, FileText, Timer, Trophy, User, LogOut, CreditCard, Shield, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";

const navItems = [
  { path: "/dashboard", icon: Scale, label: "Home" },
  { path: "/discursivas", icon: FileText, label: "Discursivas" },
  { path: "/cronometro", icon: Timer, label: "Timer" },
  { path: "/ranking", icon: Trophy, label: "Ranking" },
  { path: "/perfil", icon: User, label: "Perfil" },
  { path: "/meu-plano", icon: CreditCard, label: "Plano" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();

  const cronogramaItem = { path: "/cronograma", icon: CalendarRange, label: "Cronograma" };
  const adminItem = { path: "/admin", icon: Shield, label: "Admin" };
  const allNavItems = [
    ...navItems,
    ...((isAdmin || isModerator) ? [cronogramaItem, adminItem] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {allNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(217,91%,60%)]")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );
}
