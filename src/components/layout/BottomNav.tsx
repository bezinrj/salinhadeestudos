import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Timer,
  Trophy,
  User,
  LogOut,
  CreditCard,
  Shield,
  CalendarRange,
  Calendar,
  LayoutDashboard,
  Menu,
  X,
  GraduationCap,
  Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useState, useEffect, useRef } from "react";

const mainNavItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/discursivas", icon: FileText, label: "Discursivas" },
  { path: "/semanal", icon: Calendar, label: "Semanal" },
  { path: "/ranking", icon: Trophy, label: "Ranking" },
];

const extraNavItems = [
  { path: "/perfil", icon: User, label: "Perfil" },
  { path: "/cronometro", icon: Timer, label: "Cronômetro" },
  { path: "/turmas", icon: GraduationCap, label: "Minhas Turmas" },
  { path: "/juris", icon: Gavel, label: "Salinha Juris" },
  { path: "/cronograma", icon: CalendarRange, label: "Cronograma" },
  { path: "/meu-plano", icon: CreditCard, label: "Meu Plano" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Fechar drawer ao mudar de rota
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!drawerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [drawerOpen]);

  // Bloquear scroll do body quando drawer aberto
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const adminItems =
    isAdmin || isModerator
      ? [
          { path: "/juris/admin", icon: Gavel, label: "Juris Admin" },
          { path: "/admin", icon: Shield, label: "Admin" },
        ]
      : [];

  const allExtraItems = [...extraNavItems, ...adminItems];

  return (
    <>
      {/* Overlay escuro atrás do drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer lateral esquerdo */}
      <aside
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[80vw] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Salinha</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Itens de navegação */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <p className="mt-4 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Outros
          </p>
          {allExtraItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Botão de sair */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Barra inferior mobile — 4 itens + botão menu */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex min-w-[56px] flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    active && "drop-shadow-[0_0_6px_hsl(217,91%,60%)]",
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex min-w-[56px] flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
            <span className="font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
