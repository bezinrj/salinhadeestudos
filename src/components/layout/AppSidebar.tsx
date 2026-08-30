import { Scale, LogOut, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { navGroups as groups, adminNavGroup } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-4">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-foreground">Salinha</span>
            </div>
          ) : (
            <Scale className="mx-auto h-6 w-6 text-primary" />
          )}
        </div>

        {[...groups, ...(isAdmin || isModerator ? [adminNavGroup] : [])].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.end ? location.pathname === item.url : isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className="hover:bg-secondary/50"
                        activeClassName="bg-secondary text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <SocialLinks collapsed={collapsed} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SocialLinks({ collapsed }: { collapsed: boolean }) {
  const { data: links } = useQuery({
    queryKey: ["sidebar-social-links"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("configuracoes_site")
        .select("chave,valor")
        .in("chave", ["discord_url", "whatsapp_url"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => (map[r.chave] = r.valor));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const discord = links?.discord_url;
  const whatsapp = links?.whatsapp_url;

  return (
    <div className={`flex items-center gap-2 pb-2 ${collapsed ? "flex-col" : "justify-center"}`}>
      {discord && (
        <a
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discord"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground hover:text-green-500 hover:bg-secondary transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M20.52 3.48A11.86 11.86 0 0012.05 0C5.5 0 .18 5.32.18 11.87a11.78 11.78 0 001.6 5.94L0 24l6.34-1.66a11.85 11.85 0 005.7 1.45h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.24-6.15-3.4-8.44zM12.05 21.6h-.01a9.7 9.7 0 01-4.95-1.36l-.36-.21-3.76.98 1-3.66-.23-.38a9.72 9.72 0 01-1.49-5.1c0-5.38 4.38-9.76 9.78-9.76a9.7 9.7 0 016.9 2.86 9.7 9.7 0 012.86 6.91c0 5.38-4.38 9.76-9.74 9.76zm5.62-7.31c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.21.31-.8 1-.98 1.21-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.54-.92-.82-1.55-1.83-1.73-2.14-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.7-1.69-.96-2.31-.25-.6-.51-.52-.7-.53l-.6-.01a1.15 1.15 0 00-.84.39c-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.4 5.39 4.77.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.83-.75 2.09-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.21-.59-.36z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
