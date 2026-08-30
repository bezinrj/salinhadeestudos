import {
  FileText,
  Timer,
  Trophy,
  User,
  CreditCard,
  Shield,
  CalendarRange,
  Calendar,
  LayoutDashboard,
  BookOpen,
  Gavel,
  Library,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** exact match for active state */
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grupos compartilhados entre a sidebar (desktop) e o drawer (mobile) */
export const navGroups: NavGroup[] = [
  {
    label: "Geral",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
      { title: "Cadernos", url: "/cadernos", icon: Library },
    ],
  },
  {
    label: "Estudos",
    items: [
      { title: "Discursivas", url: "/discursivas", icon: FileText },
      { title: "Questões da Semana", url: "/semanal", icon: Calendar },
      { title: "Minhas Turmas", url: "/turmas", icon: BookOpen },
      { title: "Vade Mecum", url: "/vademecum", icon: Library },
      { title: "Salinha Juris", url: "/juris", icon: Gavel },
    ],
  },
  {
    label: "Desempenho",
    items: [
      { title: "Ranking", url: "/ranking", icon: Trophy },
      { title: "Cronômetro", url: "/cronometro", icon: Timer },
      { title: "Meu Plano", url: "/meu-plano", icon: CreditCard },
      { title: "Fale Conosco", url: "/fale-conosco", icon: LifeBuoy },
    ],
  },
];

/** Itens visíveis apenas para admin/moderador */
export const adminNavGroup: NavGroup = {
  label: "Administração",
  items: [
    { title: "Cronograma", url: "/cronograma", icon: CalendarRange },
    { title: "Juris Admin", url: "/juris/admin", icon: Gavel },
    { title: "Admin", url: "/admin", icon: Shield, end: true },
  ],
};

/** Atalhos da barra inferior mobile */
export const bottomNavItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Discursivas", url: "/discursivas", icon: FileText },
  { title: "Semanal", url: "/semanal", icon: Calendar },
  { title: "Ranking", url: "/ranking", icon: Trophy },
];
