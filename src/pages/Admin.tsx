import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Users, MessageSquare, Bell, Trash2, Plus, Activity, Crown, GraduationCap, KeyRound, X, UserCheck, UserX, CreditCard, Ban, Eye, Gift, Clock, CalendarDays, Trophy, Pencil, Check, ArrowUp, ArrowDown, Mail, UserPlus, Phone, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getPlanByPriceId } from "@/lib/stripe";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { evaluateAnswer } from "@/data/mockData";
import { useDisciplines } from "@/hooks/useDisciplines";
import { cn } from "@/lib/utils";
import { SubjectTreeSelect } from "@/components/SubjectTreeSelect";
import ModerationRequestsTab from "@/components/ModerationRequestsTab";
import AdminAlertsTab from "@/components/AdminAlertsTab";
import MateriasTab from "@/components/MateriasTab";
import TurmasAdminTab from "@/components/TurmasAdminTab";
import FeedbacksAdminTab from "@/components/admin/FeedbacksAdminTab";
import SiteConfigTab from "@/components/admin/SiteConfigTab";


const ABSOLUTE_ADMIN_ID = "ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6";

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isModerator, loading: modLoading } = useIsModerator();
  const navigate = useNavigate();

  const hasAccess = isAdmin || isModerator;
  const loading = adminLoading || modLoading;

  const { data: pendingAlerts = 0 } = useQuery({
    queryKey: ["admin-pending-alerts-count"],
    queryFn: async () => {
      const { count, error } = await (supabase.from("question_reports" as any) as any)
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
  });

  const { data: pendingRequests = 0 } = useQuery({
    queryKey: ["admin-pending-requests-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("moderation_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!loading && !hasAccess) navigate("/dashboard", { replace: true });
  }, [hasAccess, loading, navigate]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Verificando permissões...</p></div>;
  if (!hasAccess) return null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold">Painel Administrativo</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Gerencie usuários, conteúdo e configurações do sistema.</p>
      </motion.div>

      {isAdmin ? (
         <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto flex-nowrap scrollbar-hide bg-secondary h-auto p-1 md:grid md:grid-cols-[repeat(13,minmax(0,1fr))]">
            <TabsTrigger value="overview" className="shrink-0 md:shrink">Visão Geral</TabsTrigger>
            <TabsTrigger value="users" className="shrink-0 md:shrink">Usuários</TabsTrigger>
            <TabsTrigger value="weekly" className="shrink-0 md:shrink">Semanal</TabsTrigger>
            <TabsTrigger value="turmas" className="shrink-0 md:shrink">Turmas</TabsTrigger>
            <TabsTrigger value="alerts" className="relative shrink-0 md:shrink">
              Alertas
              {pendingAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                  {pendingAlerts > 99 ? "99+" : pendingAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative shrink-0 md:shrink">
              Solicitações
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                  {pendingRequests > 99 ? "99+" : pendingRequests}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="shrink-0 md:shrink">Avisos</TabsTrigger>
            <TabsTrigger value="content" className="shrink-0 md:shrink">Conteúdo</TabsTrigger>
            <TabsTrigger value="subjects" className="shrink-0 md:shrink">Assuntos</TabsTrigger>
            <TabsTrigger value="materias" className="shrink-0 md:shrink">Matérias</TabsTrigger>
            <TabsTrigger value="feedbacks" className="shrink-0 md:shrink">Feedbacks</TabsTrigger>
            <TabsTrigger value="config" className="shrink-0 md:shrink">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="weekly"><WeeklyQuestionsTab /></TabsContent>
          <TabsContent value="turmas"><TurmasAdminTab /></TabsContent>
          <TabsContent value="alerts"><AdminAlertsTab /></TabsContent>
          <TabsContent value="requests"><ModerationRequestsTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
          <TabsContent value="subjects"><SubjectsTab /></TabsContent>
          <TabsContent value="materias"><MateriasTab /></TabsContent>
          <TabsContent value="feedbacks"><FeedbacksAdminTab /></TabsContent>
          <TabsContent value="config"><SiteConfigTab /></TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto flex-nowrap scrollbar-hide bg-secondary h-auto p-1 md:grid md:grid-cols-4">
            <TabsTrigger value="weekly" className="shrink-0 md:shrink">Semanal</TabsTrigger>
            <TabsTrigger value="turmas" className="shrink-0 md:shrink">Turmas</TabsTrigger>
            <TabsTrigger value="subjects" className="shrink-0 md:shrink">Assuntos</TabsTrigger>
            <TabsTrigger value="materias" className="shrink-0 md:shrink">Matérias</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly"><WeeklyQuestionsTab /></TabsContent>
          <TabsContent value="turmas"><TurmasAdminTab /></TabsContent>
          <TabsContent value="subjects"><SubjectsTab /></TabsContent>
          <TabsContent value="materias"><MateriasTab /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab() {
  const [showCortesias, setShowCortesias] = useState(false);
  const [cortesiaSearch, setCortesiaSearch] = useState("");
  const [cortesiaFilter, setCortesiaFilter] = useState<"all" | "active" | "expired">("active");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, sessions, manualSubs] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("user_sessions").select("user_id, last_seen_at").limit(500),
        supabase.from("manual_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true).gte("expires_at", new Date().toISOString()),
      ]);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const onlineUsers = (sessions.data || []).filter((s: any) => s.last_seen_at > fiveMinAgo);

      return {
        totalUsers: profiles.count || 0,
        onlineNow: onlineUsers.length,
        manualPlans: manualSubs.count || 0,
        activeUsers: (sessions.data || []).filter((s: any) => s.last_seen_at > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length,
        blockedUsers: 0,
        activeSubscriptions: 0,
        onlineList: onlineUsers,
      };
    },
    refetchInterval: 300_000,
  });

  const { data: allCortesias } = useQuery({
    queryKey: ["admin-all-cortesias"],
    queryFn: async () => {
      const { data } = await supabase
        .from("manual_subscriptions")
        .select("*")
        .order("expires_at", { ascending: false });
      if (!data?.length) return [];
      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, username, name, avatar_url").in("id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return data.map((s: any) => ({
        ...s,
        profile: profileMap.get(s.user_id) || null,
        isExpired: !s.is_active || new Date(s.expires_at) < new Date(),
      }));
    },
    enabled: showCortesias,
  });

  const filteredCortesias = (allCortesias || []).filter((c: any) => {
    if (cortesiaFilter === "active" && c.isExpired) return false;
    if (cortesiaFilter === "expired" && !c.isExpired) return false;
    if (cortesiaSearch) {
      const q = cortesiaSearch.toLowerCase();
      const name = (c.profile?.name || "").toLowerCase();
      const username = (c.profile?.username || "").toLowerCase();
      return name.includes(q) || username.includes(q);
    }
    return true;
  }).sort((a: any, b: any) => {
    if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
    return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime();
  });

  const { data: onlineProfiles } = useQuery({
    queryKey: ["admin-online-profiles", stats?.onlineList],
    queryFn: async () => {
      if (!stats?.onlineList?.length) return [];
      const ids = stats.onlineList.map((s: any) => s.user_id);
      const { data } = await supabase.from("profiles").select("id, name, username, avatar_url, subscription_tier").in("id", ids);
      return (data || []).map((p: any) => {
        const session = stats.onlineList.find((s: any) => s.user_id === p.id);
        return { ...p, last_seen_at: session?.last_seen_at };
      });
    },
    enabled: !!stats?.onlineList?.length,
  });

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "agora";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}min atrás`;
    return `${Math.floor(mins / 60)}h atrás`;
  };

  const overviewCards = [
    { title: "Total de Usuários", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", onClick: undefined },
    { title: "Online Agora", value: stats?.onlineNow ?? 0, icon: Activity, color: "text-green-400", bg: "bg-green-500/10", onClick: undefined },
    { title: "Cortesias Ativas", value: stats?.manualPlans ?? 0, icon: Gift, color: "text-orange-400", bg: "bg-orange-500/10", onClick: () => setShowCortesias(true) },
    { title: "Ativos (24h)", value: stats?.activeUsers ?? 0, icon: UserCheck, color: "text-sky-400", bg: "bg-sky-500/10", onClick: undefined },
    { title: "Bloqueados", value: stats?.blockedUsers ?? 0, icon: Ban, color: "text-red-400", bg: "bg-red-500/10", onClick: undefined },
    { title: "Assinaturas Ativas", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-primary", bg: "bg-primary/10", onClick: undefined },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewCards.map((card) => (
          <Card
            key={card.title}
            className={cn("gradient-card border-border hover:scale-[1.02] transition-transform", card.onClick && "cursor-pointer hover:border-primary/40")}
            onClick={card.onClick}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cortesias Drawer */}
      <Drawer open={showCortesias} onOpenChange={setShowCortesias}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-400" />
                <DrawerTitle>Cortesias</DrawerTitle>
              </div>
              <DrawerClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button></DrawerClose>
            </div>
            <DrawerDescription>Gerencie todas as cortesias atribuídas aos usuários.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Buscar por nome ou username..." value={cortesiaSearch} onChange={(e) => setCortesiaSearch(e.target.value)} className="max-w-sm" />
              <div className="flex gap-1">
                {(["active", "expired", "all"] as const).map((f) => (
                  <Button key={f} variant={cortesiaFilter === f ? "default" : "outline"} size="sm" onClick={() => setCortesiaFilter(f)}>
                    {f === "active" ? "Ativas" : f === "expired" ? "Expiradas" : "Todas"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredCortesias.length ? filteredCortesias.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={c.profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{(c.profile?.name || c.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.profile?.name || c.profile?.username || "—"}</p>
                    <p className="text-xs text-muted-foreground">@{c.profile?.username || "—"}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <Badge className={cn("text-[10px]", c.isExpired ? "bg-red-500/20 text-red-400 border-red-400/30" : "bg-green-500/20 text-green-400 border-green-400/30")}>
                      {c.isExpired ? "Expirada" : "Ativa"}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground">{c.plan_type === "trial" ? "Trial" : "Premium"}</p>
                  </div>
                  <div className="text-right space-y-0.5 hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">Início: {new Date(c.starts_at).toLocaleDateString("pt-BR")}</p>
                    <p className="text-[10px] text-muted-foreground">Término: {new Date(c.expires_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma cortesia encontrada.</p>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Usuários Online Agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineProfiles?.length ? (
            <div className="space-y-2">
              {onlineProfiles.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{(p.name || p.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name || p.username}</p>
                    <p className="text-xs text-muted-foreground">@{p.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.last_seen_at ? formatRelativeTime(p.last_seen_at) : "agora"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário online no momento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"all" | "new" | "active">("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: { email, redirectTo: `${window.location.origin}/login` },
      });
      const errMsg = (data as any)?.error;
      if (errMsg) throw new Error(errMsg);
      if (error) {
        // Try to read the response body returned by the function (FunctionsHttpError)
        const ctx: any = (error as any).context;
        let bodyMsg: string | undefined;
        try { bodyMsg = (await ctx?.json?.())?.error; } catch { /* ignore */ }
        throw new Error(bodyMsg || error.message);
      }
      toast({ title: "Convite enviado!", description: `E-mail enviado para ${email}.` });
      setInviteEmail("");
      setInviteOpen(false);
    } catch (e: any) {
      toast({ title: "Não foi possível convidar", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const { data: sessions } = useQuery({
    queryKey: ["admin-all-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("user_sessions").select("user_id, last_seen_at").limit(500);
      return data || [];
    },
    refetchInterval: 300_000,
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data || [];
    },
  });

  const { data: userEmails } = useQuery({
    queryKey: ["admin-user-emails"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-list-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao buscar emails");
      const emailMap = new Map(result.users.map((u: any) => [u.id, u.email]));
      return emailMap;
    },
    enabled: true,
  });

  const { data: manualSubs } = useQuery({
    queryKey: ["admin-all-manual-subs"],
    queryFn: async () => {
      const { data } = await supabase.from("manual_subscriptions").select("id, user_id, expires_at, is_active, created_at").eq("is_active", true).gte("expires_at", new Date().toISOString());
      return data || [];
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["admin-user-contacts"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("user_contact_info").select("user_id, whatsapp");
      const map = new Map<string, string>();
      (data || []).forEach((c: any) => { if (c.whatsapp) map.set(c.user_id, c.whatsapp); });
      return map;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id, name, username, avatar_url, subscription_tier, active_badge_id, total_score, created_at, streak").order("created_at", { ascending: false }).limit(200);
      if (search) query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const onlineIds = new Set((sessions || []).filter((s: any) => s.last_seen_at > fiveMinAgo).map((s: any) => s.user_id));

  const filteredUsers = (users || []).filter((u: any) => {
    if (subTab === "new") return u.created_at && u.created_at > sevenDaysAgo;
    if (subTab === "active") return onlineIds.has(u.id);
    return true;
  });

  const getUserRoles = (userId: string) => {
    return (roles || []).filter((r: any) => r.user_id === userId).map((r: any) => r.role);
  };

  const hasCortesia = (userId: string) => {
    return (manualSubs || []).some((s: any) => s.user_id === userId);
  };

  const getAccessType = (userId: string, profile: any): "cortesia" | "premium" | "gratuito" => {
    if (hasCortesia(userId)) return "cortesia";
    if (profile.subscription_tier) return "premium";
    return "gratuito";
  };

  const getLastSeen = (userId: string) => {
    const s = (sessions || []).find((s: any) => s.user_id === userId);
    if (!s?.last_seen_at) return null;
    return s.last_seen_at;
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "agora";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  const accessBadge = (type: "cortesia" | "premium" | "gratuito") => {
    if (type === "cortesia") return <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30 text-[10px]"><Gift className="h-3 w-3 mr-1" />Cortesia</Badge>;
    if (type === "premium") return <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-[10px]"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">Gratuito</Badge>;
  };

  const roleBadges = (userRoles: string[]) => {
    return userRoles.map((role) => {
      if (role === "admin") return <Badge key={role} className="bg-red-500/20 text-red-400 border-red-400/30 text-[10px]"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      if (role === "moderator") return <Badge key={role} className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-[10px]"><GraduationCap className="h-3 w-3 mr-1" />Moderador</Badge>;
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Input placeholder="Buscar por nome ou username..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <div className="flex gap-1">
            {(["all", "new", "active"] as const).map((t) => (
              <Button key={t} variant={subTab === t ? "default" : "outline"} size="sm" onClick={() => setSubTab(t)}>
                {t === "all" ? `Todos (${users?.length || 0})` : t === "new" ? `Novos (${(users || []).filter((u: any) => u.created_at > sevenDaysAgo).length})` : `Ativos (${onlineIds.size})`}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              const rows = [["Nome", "Username", "Email", "WhatsApp", "Plano", "Cadastro"]];
              (users || []).forEach((u: any) => {
                const wpp = contacts?.get(u.id) || "";
                if (!wpp) return; // só leads com whatsapp
                rows.push([
                  u.name || "",
                  u.username || "",
                  (userEmails?.get(u.id) as string) || "",
                  wpp,
                  getAccessType(u.id, u),
                  u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "",
                ]);
              });
              const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />Exportar leads
          </Button>
          <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" />Convidar usuário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map((u: any) => {
          const userRolesList = getUserRoles(u.id);
          const accessType = getAccessType(u.id, u);
          const isOnline = onlineIds.has(u.id);
          const lastSeen = getLastSeen(u.id);
          return (
            <Card key={u.id} className="gradient-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">{(u.name || u.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isOnline && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{u.name || u.username}</p>
                      {accessBadge(accessType)}
                      {roleBadges(userRolesList)}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{(userEmails?.get(u.id) as string) || "—"}</p>
                    {contacts?.get(u.id) && (
                      <p className="text-xs text-green-400 truncate flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contacts.get(u.id)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {isOnline ? (
                        <span className="text-[10px] text-green-400 font-medium">● Ativo</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">● Inativo</span>
                      )}
                      {lastSeen && <span className="text-[10px] text-muted-foreground">· Visto {formatRelativeTime(lastSeen)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setSelectedUser(u)}>
                    <Eye className="h-3 w-3 mr-1" />Acompanhar
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setSelectedUser(u)}>
                    <Trash2 className="h-3 w-3 mr-1" />Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!filteredUsers.length && <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>}

      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          role={getUserRoles(selectedUser.id)[0] || "user"}
          isOnline={onlineIds.has(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Convidar usuário</DialogTitle>
            <DialogDescription>
              Será enviado um e-mail de convite usando o template "Convidar" da Salinha de Estudos. O usuário poderá aceitar e criar sua conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              placeholder="usuario@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !inviting) handleInvite(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting} className="gap-1.5">
              <Mail className="h-4 w-4" />{inviting ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── User Detail Drawer ─── */
function UserDetailDrawer({ user, role, isOnline, onClose }: { user: any; role: string; isOnline: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: userComments } = useQuery({
    queryKey: ["admin-user-comments", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("question_comments").select("id, question_id, content, created_at, score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      const list = data || [];
      const ids = Array.from(new Set(list.map((c: any) => c.question_id).filter(Boolean)));
      let qmap: Record<string, any> = {};
      if (ids.length) {
        const { data: qs } = await supabase.from("weekly_questions").select("id, public_id, is_weekly, title").in("id", ids as string[]);
        qmap = Object.fromEntries((qs || []).map((q: any) => [q.id, q]));
      }
      return list.map((c: any) => ({ ...c, weekly_questions: qmap[c.question_id] || null }));
      return data || [];
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      if (newRole !== "user") {
        const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: newRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role atualizada com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao resetar senha");
      return result;
    },
    onSuccess: () => toast({ title: "Email de reset enviado!", description: "O usuário receberá um email para redefinir a senha." }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao deletar usuário");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Conta deletada", description: "O usuário foi removido permanentemente." });
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">{(user.name || user.username || "?")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle>{user.name || user.username}</DrawerTitle>
                <DrawerDescription>@{user.username}</DrawerDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="text-green-400 border-green-400/30">Online</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Offline</Badge>
              )}
              <DrawerClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button></DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bio</p>
              <p className="text-sm mt-1">{user.bio || "—"}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Carreira Alvo</p>
              <p className="text-sm mt-1">{user.target_career || "—"}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "Score", value: user.total_score ?? 0 },
              { label: "Discursivas", value: user.total_essays ?? 0 },
              { label: "Streak", value: `${user.streak ?? 0}🔥` },
              { label: "Likes", value: user.likes_count ?? 0 },
              { label: "Reputação", value: user.comment_score ?? 0 },
              { label: "Horas/Sem", value: user.weekly_hours ?? 0 },
            ].map((s) => (
              <div key={s.label} className="p-2 rounded-lg bg-secondary/50 text-center">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Subscription Info */}
          <UserSubscriptionInfo userId={user.id} />

          <Separator />

          {/* Turmas */}
          <UserTurmasSection userId={user.id} />

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Ações</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Alterar Role</p>
                {user.id === ABSOLUTE_ADMIN_ID ? (
                  <p className="text-xs text-yellow-400 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">⚡ Admin Absoluto — não pode ser alterado</p>
                ) : (
                  <Select defaultValue={role} onValueChange={(v) => roleMutation.mutate(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Aluno</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Senha</p>
                <Button variant="outline" className="w-full" onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Enviar Reset de Senha
                </Button>
              </div>
            </div>

            {/* Delete account */}
            {user.id !== ABSOLUTE_ADMIN_ID && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar Conta do Usuário
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é <strong>irreversível</strong>. A conta de <strong>@{user.username}</strong> será permanentemente deletada, incluindo perfil, comentários e dados associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteUserMutation.mutate()}
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? "Deletando..." : "Sim, deletar conta"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <Separator />

          {/* Recent comments */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Comentários Recentes</h3>
            {userComments?.length ? userComments.map((c: any) => {
              const pid = c.weekly_questions?.public_id;
              const isWeekly = c.weekly_questions?.is_weekly;
              const code = pid ? `Q-${String(pid).padStart(3, "0")}` : null;
              const href = code ? (isWeekly ? `/semanal/${code}` : `/discursivas/${code}`) : `/discursivas/${c.question_id}`;
              return (
              <a key={c.id} href={href} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <p className="text-xs text-muted-foreground">Questão {code || c.question_id}{c.weekly_questions?.title ? ` — ${c.weekly_questions.title}` : ""} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                <p className="text-sm mt-1">{c.content}</p>
              </a>
              );
            }) : (
              <p className="text-xs text-muted-foreground">Nenhum comentário.</p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">Cadastro: {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── Announcements Tab ─── */
function AnnouncementsTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { data: announcements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_announcements").select("id, title, message, is_active, created_at, created_by").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_announcements").insert({ title, message, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setMessage("");
      toast({ title: "Aviso criado!", description: "Todos os usuários verão este aviso." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("admin_announcements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Aviso removido." });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Novo Aviso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Título do aviso" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Mensagem do aviso..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !message.trim() || createMutation.isPending} className="w-full sm:w-auto">
            <Bell className="h-4 w-4 mr-2" /> Publicar Aviso
          </Button>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Avisos Existentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements?.length ? announcements.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={a.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: a.id, is_active: checked })} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviso criado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Weekly Questions Tab ─── */
function WeeklyQuestionsTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { disciplines } = useDisciplines();
  const { isAdmin } = useIsAdmin();
  const [modJustification, setModJustification] = useState("");
  const [modAction, setModAction] = useState<{ type: "edit" | "delete"; question: any } | null>(null);
  const [title, setTitle] = useState("");
  const [career, setCareer] = useState("Delegado");
  const [discipline, setDiscipline] = useState("");
  const [subject, setSubject] = useState("");
  const [statement, setStatement] = useState("");
  
  const [testAnswer, setTestAnswer] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [showTest, setShowTest] = useState(false);
  const [isWeekly, setIsWeekly] = useState(true);
  const [isPremiumQ, setIsPremiumQ] = useState(false);
  const [mirrorText, setMirrorText] = useState("");
  const [idealAnswer, setIdealAnswer] = useState("");
  const [banca, setBanca] = useState("INÉDITA");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState("");
  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCareer, setEditCareer] = useState("Delegado");
  const [editDiscipline, setEditDiscipline] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editStatement, setEditStatement] = useState("");
  
  const [editMirrorText, setEditMirrorText] = useState("");
  const [editIdealAnswer, setEditIdealAnswer] = useState("");
  const [editIsWeekly, setEditIsWeekly] = useState(false);
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editBanca, setEditBanca] = useState("INÉDITA");
  const [editYear, setEditYear] = useState(String(new Date().getFullYear()));
  const { data: questions } = useQuery({
    queryKey: ["admin-weekly-questions"],
    queryFn: async () => {
      const { data } = await supabase.from("weekly_questions").select("id, public_id, title, career, discipline, subject, statement, mirror_text, ideal_answer, banca, year, is_active, is_weekly, is_premium, created_at, deadline").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: waitlistCount } = useQuery({
    queryKey: ["admin-waitlist-count"],
    queryFn: async () => {
      const { count } = await supabase.from("weekly_waitlist").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });


  function getNextSundayDeadline(): string {
    const now = new Date();
    const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const dayOfWeek = brt.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(brt);
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    const utcTime = new Date(nextSunday.getTime() + 3 * 60 * 60 * 1000);
    return utcTime.toISOString();
  }

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (isWeekly) {
        const deadline = getNextSundayDeadline();
        await (supabase.from("weekly_questions") as any).update({ is_active: false }).eq("is_active", true).eq("is_weekly", true);
        const { error } = await (supabase.from("weekly_questions") as any).insert({
          title, career, discipline, statement, deadline,
          is_active: true, created_by: user?.id,
          is_weekly: true, is_premium: true,
          mirror_text: mirrorText.trim() || null,
          ideal_answer: idealAnswer.trim() || null,
          banca, subject: subject.trim() || null,
          year: parseInt(year),
        });
        if (error) throw error;
        await supabase.from("weekly_waitlist").update({ notified: false }).eq("notified", true);
      } else {
        const { error } = await (supabase.from("weekly_questions") as any).insert({
          title, career, discipline, statement,
          deadline: null, is_active: true, created_by: user?.id,
          is_weekly: false, is_premium: isPremiumQ,
          mirror_text: mirrorText.trim() || null,
          ideal_answer: idealAnswer.trim() || null,
          banca, subject: subject.trim() || null,
          year: parseInt(year),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-questions"] });
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      setTitle(""); setCareer("Delegado"); setDiscipline(""); setSubject(""); setStatement(""); setTestResult(null); setTestAnswer(""); setShowTest(false); setIsWeekly(true); setIsPremiumQ(false); setMirrorText(""); setIdealAnswer(""); setBanca("INÉDITA"); setYear(String(new Date().getFullYear()));
      toast({ title: isWeekly ? "Questão semanal publicada!" : "Questão discursiva publicada!", description: isWeekly ? "Os usuários na lista de espera serão notificados." : undefined });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("weekly_questions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-weekly-questions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-questions"] });
      toast({ title: "Questão removida." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuestion) return;

      // Se voltou a ser Semanal mas não tem deadline futuro, define para o próximo domingo 00:00 BRT.
      let nextDeadline: string | null | undefined = undefined; // undefined = não alterar
      if (editIsWeekly) {
        const currentDeadline = editingQuestion.deadline ? new Date(editingQuestion.deadline) : null;
        if (!currentDeadline || currentDeadline.getTime() <= Date.now()) {
          // Próximo domingo 00:00 horário de Brasília (UTC-3) → 03:00 UTC
          const now = new Date();
          const utcDay = now.getUTCDay();
          const daysUntilSunday = (7 - utcDay) % 7 || 7;
          const sunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday, 3, 0, 0));
          nextDeadline = sunday.toISOString();
        }
      } else {
        nextDeadline = null; // limpa quando deixa de ser semanal
      }

      const { error } = await (supabase.from("weekly_questions") as any)
        .update({
          title: editTitle,
          career: editCareer,
          discipline: editDiscipline,
          subject: editSubject.trim() || null,
          statement: editStatement,
          is_weekly: editIsWeekly,
          is_premium: editIsPremium,
          ...(nextDeadline !== undefined ? { deadline: nextDeadline } : {}),
          mirror_text: editMirrorText.trim() || null,
          ideal_answer: editIdealAnswer.trim() || null,
          banca: editBanca,
          year: parseInt(editYear),
        })
        .eq("id", editingQuestion.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-questions"] });
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-question-active"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-challenge-ranking"] });
      setEditingQuestion(null);
      toast({ title: "Questão atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Moderation request mutation (for moderators)
  const modRequestMutation = useMutation({
    mutationFn: async ({ type, questionId, proposedData, justification }: { type: "edit" | "delete"; questionId: string; proposedData?: any; justification: string }) => {
      const { error } = await (supabase.from("moderation_requests") as any).insert({
        request_type: type,
        question_id: questionId,
        requester_id: user?.id,
        justification,
        proposed_data: proposedData || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-requests"] });
      setModAction(null);
      setModJustification("");
      setEditingQuestion(null);
      toast({ title: "Solicitação enviada!", description: "Um administrador precisará aprovar sua solicitação." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openEditDialog = (q: any) => {
    setEditingQuestion(q);
    setEditTitle(q.title);
    setEditCareer(q.career);
    setEditDiscipline(q.discipline);
    setEditSubject(q.subject || "");
    setEditStatement(q.statement);
    
    setEditIsWeekly(q.is_weekly);
    setEditIsPremium(q.is_premium);
    setEditMirrorText(q.mirror_text || "");
    setEditIdealAnswer(q.ideal_answer || "");
    setEditBanca(q.banca || "INÉDITA");
    setEditYear(q.year ? String(q.year) : String(new Date().getFullYear()));
  };

  return (
    <div className="space-y-6">
      {/* Waitlist info */}
      <Card className="gradient-card border-border">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="rounded-lg bg-gold/10 p-2.5">
            <Users className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">{waitlistCount}</p>
            <p className="text-xs text-muted-foreground">Pessoas na lista de espera</p>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Nova Questão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <Switch checked={isWeekly} onCheckedChange={setIsWeekly} />
              <span className="text-sm font-medium">{isWeekly ? "Questão Semanal" : "Questão Regular"}</span>
            </div>
            {!isWeekly && (
              <div className="flex items-center gap-2">
                <Switch checked={isPremiumQ} onCheckedChange={setIsPremiumQ} />
                <span className="text-sm">Premium</span>
              </div>
            )}
          </div>
          <Input placeholder="Título da questão" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={career} onValueChange={setCareer}>
            <SelectTrigger><SelectValue placeholder="Carreira" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Delegado">Delegado</SelectItem>
              <SelectItem value="Magistratura Estadual">Magistratura Estadual</SelectItem>
              <SelectItem value="Magistratura Federal">Magistratura Federal</SelectItem>
              <SelectItem value="Ministério Público">Ministério Público</SelectItem>
              <SelectItem value="Defensoria">Defensoria</SelectItem>
              <SelectItem value="Procuradoria">Procuradoria</SelectItem>
              <SelectItem value="Analista">Analista</SelectItem>
              <SelectItem value="EMERJ">EMERJ</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-4 gap-3">
            <Select value={discipline} onValueChange={(v) => { setDiscipline(v); setSubject(""); }}>
              <SelectTrigger><SelectValue placeholder="Matéria / Disciplina" /></SelectTrigger>
              <SelectContent>
                {disciplines.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SubjectTreeSelect
              discipline={discipline}
              value={subject || "Todas"}
              onValueChange={(v) => setSubject(v === "Todas" ? "" : v)}
              disabled={!discipline}
              placeholder={discipline ? "Assunto" : "Selecione matéria"}
            />
            <Select value={banca} onValueChange={setBanca}>
              <SelectTrigger><SelectValue placeholder="Banca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CEBRASPE">CEBRASPE</SelectItem>
                <SelectItem value="FGV">FGV</SelectItem>
                <SelectItem value="VUNESP">VUNESP</SelectItem>
                <SelectItem value="INÉDITA">INÉDITA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {["2021","2022","2023","2024","2025","2026"].map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Enunciado completo da questão..." value={statement} onChange={(e) => setStatement(e.target.value)} rows={6} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Barema / Critérios de Correção (texto livre)</label>
            <Textarea
              placeholder="Cole aqui o barema ou os critérios de correção em texto livre. O corretor usará exatamente estes critérios para avaliar a resposta do aluno."
              value={mirrorText}
              onChange={(e) => setMirrorText(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">O barema será usado como espelho oficial da correção. Não será convertido em JSON.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gabarito (Resposta de Referência)</label>
            <Textarea
              placeholder="Cole aqui o gabarito oficial ou resposta de referência. A resposta ideal personalizada será gerada automaticamente com base nos erros de cada aluno."
              value={idealAnswer}
              onChange={(e) => setIdealAnswer(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">O gabarito será a referência oficial. A resposta ideal é gerada automaticamente para cada aluno.</p>
          </div>

          {(mirrorText.trim() || idealAnswer.trim()) && (
            <div className="space-y-3">
              <Button type="button" variant="outline" onClick={() => setShowTest(!showTest)} className="gap-2">
                <Eye className="h-4 w-4" /> {showTest ? "Fechar Teste" : "Testar Correção"}
              </Button>
              
              {showTest && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Teste de Correção</p>
                    <Textarea
                      placeholder="Cole aqui uma resposta de exemplo para testar a correção..."
                      value={testAnswer}
                      onChange={(e) => setTestAnswer(e.target.value)}
                      rows={6}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('evaluate-answer', {
                            body: {
                              answer: testAnswer,
                              baremaText: mirrorText || undefined,
                              gabarito: idealAnswer || undefined,
                              statement: statement || undefined,
                            },
                          });
                          if (!error && !data?.error) {
                            setTestResult(data);
                          } else {
                            toast({ title: "Erro na correção", description: data?.error || "Tente novamente.", variant: "destructive" });
                          }
                        } catch (e: any) {
                          toast({ title: "Erro na correção", description: e.message, variant: "destructive" });
                        }
                      }}
                      disabled={!testAnswer.trim()}
                    >
                      Executar Correção
                    </Button>
                    
                    {testResult && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg px-3 py-1">{testResult.grade}/10</Badge>
                          <p className="text-sm text-muted-foreground">{testResult.feedback}</p>
                        </div>
                        <Separator />
                        {testResult.baremaBreakdown?.map((item: any) => (
                          <div key={item.letter} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium">({item.letter}) {item.title}</p>
                              <Badge variant="outline" className="text-xs">{item.earnedScore}/{item.maxScore}</Badge>
                            </div>
                            {item.subitems?.map((sub: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs pl-4">
                                <span className={cn(
                                  "h-2 w-2 rounded-full",
                                  sub.status === "full" ? "bg-green-500" : sub.status === "partial" ? "bg-yellow-500" : "bg-destructive"
                                )} />
                                <span className="flex-1 text-muted-foreground">{sub.description}</span>
                                <span>{sub.earnedScore}/{sub.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {isWeekly && <p className="text-xs text-muted-foreground">O prazo será automaticamente definido para o próximo domingo às 00:00 (horário de Brasília).</p>}
          <Button onClick={() => publishMutation.mutate()} disabled={!title.trim() || !statement.trim() || !discipline.trim() || publishMutation.isPending} className="w-full sm:w-auto">
            <Trophy className="h-4 w-4 mr-2" /> {isWeekly ? "Publicar Questão Semanal" : "Publicar Questão"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing questions */}
      <Card className="gradient-card border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">Todas as Questões</CardTitle>
          <Input
            placeholder="Buscar por ID ou título..."
            className="max-w-xs h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {(questions || []).filter((q: any) => {
            if (!searchQuery.trim()) return true;
            const s = searchQuery.toLowerCase();
            return q.id.toLowerCase().includes(s) || q.title.toLowerCase().includes(s);
          }).length ? (questions || []).filter((q: any) => {
            if (!searchQuery.trim()) return true;
            const s = searchQuery.toLowerCase();
            return q.id.toLowerCase().includes(s) || q.title.toLowerCase().includes(s);
          }).map((q: any) => (
            <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{q.title}</p>
                  {q.is_weekly && (
                    <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">Semanal</Badge>
                  )}
                  {q.is_premium && !q.is_weekly && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-[10px]">Premium</Badge>
                  )}
                  {q.is_active && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-[10px]">Ativa</Badge>
                  )}
                  {q.deadline && new Date(q.deadline) <= new Date() && (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">Encerrada</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-mono text-[10px] text-primary/60 select-all">Q-{String((q as any).public_id || '?').padStart(3, '0')}</span> · {q.career} · {q.discipline}{q.banca ? ` · ${q.banca}` : ""}{q.year ? ` · ${q.year}` : ""}
                </p>
                {q.deadline && <p className="text-[10px] text-muted-foreground mt-1">Prazo: {new Date(q.deadline).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" onClick={() => openEditDialog(q)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <>
                    <Switch checked={q.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: q.id, is_active: checked })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(q.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!isAdmin && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setModAction({ type: "delete", question: q }); setModJustification(""); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma questão criada ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingQuestion && (
        <Drawer open onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Editar Questão</DrawerTitle>
              <DrawerDescription>Altere os campos desejados e salve.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-3 overflow-y-auto">
              <Input placeholder="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <Select value={editCareer} onValueChange={setEditCareer}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delegado">Delegado</SelectItem>
                  <SelectItem value="Magistratura Estadual">Magistratura Estadual</SelectItem>
                  <SelectItem value="Magistratura Federal">Magistratura Federal</SelectItem>
                  <SelectItem value="Ministério Público">Ministério Público</SelectItem>
                  <SelectItem value="Defensoria">Defensoria</SelectItem>
                  <SelectItem value="Procuradoria">Procuradoria</SelectItem>
                  <SelectItem value="Analista">Analista</SelectItem>
                  <SelectItem value="EMERJ">EMERJ</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-4 gap-3">
                <Select value={editDiscipline} onValueChange={(v) => { setEditDiscipline(v); setEditSubject(""); }}>
                  <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                  <SelectContent>
                    {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <SubjectTreeSelect
                  discipline={editDiscipline}
                  value={editSubject || "Todas"}
                  onValueChange={(v) => setEditSubject(v === "Todas" ? "" : v)}
                  disabled={!editDiscipline}
                  placeholder={editDiscipline ? "Assunto" : "Selecione matéria"}
                />
                <Select value={editBanca} onValueChange={setEditBanca}>
                  <SelectTrigger><SelectValue placeholder="Banca" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEBRASPE">CEBRASPE</SelectItem>
                    <SelectItem value="FGV">FGV</SelectItem>
                    <SelectItem value="VUNESP">VUNESP</SelectItem>
                    <SelectItem value="INÉDITA">INÉDITA</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={editYear} onValueChange={setEditYear}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>
                    {["2021","2022","2023","2024","2025","2026"].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Enunciado" value={editStatement} onChange={(e) => setEditStatement(e.target.value)} rows={5} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Barema / Critérios de Correção (texto livre)</label>
                <Textarea
                  placeholder="Cole aqui o barema ou os critérios de correção em texto livre..."
                  value={editMirrorText}
                  onChange={(e) => setEditMirrorText(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gabarito (Resposta de Referência)</label>
                <Textarea
                  placeholder="Cole aqui o gabarito oficial ou resposta de referência..."
                  value={editIdealAnswer}
                  onChange={(e) => setEditIdealAnswer(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editIsWeekly} onCheckedChange={setEditIsWeekly} />
                  <span className="text-sm">Semanal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editIsPremium} onCheckedChange={setEditIsPremium} />
                  <span className="text-sm">Premium</span>
                </div>
              </div>
              {isAdmin ? (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editTitle.trim() || !editStatement.trim()}>
                    {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancelar</Button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Justificativa para a edição (obrigatório)..."
                    value={modJustification}
                    onChange={(e) => setModJustification(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => modRequestMutation.mutate({
                        type: "edit",
                        questionId: editingQuestion.id,
                        justification: modJustification,
                        proposedData: {
                          title: editTitle, career: editCareer, discipline: editDiscipline,
                          subject: editSubject.trim() || null, statement: editStatement,
                          is_weekly: editIsWeekly, is_premium: editIsPremium,
                          mirror_text: editMirrorText.trim() || null, ideal_answer: editIdealAnswer.trim() || null,
                          banca: editBanca, year: parseInt(editYear),
                        },
                      })}
                      disabled={modRequestMutation.isPending || !editTitle.trim() || !editStatement.trim() || !modJustification.trim()}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {modRequestMutation.isPending ? "Enviando..." : "Solicitar Edição"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancelar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Sua solicitação será enviada para aprovação de um administrador.</p>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Moderator delete request dialog */}
      {modAction && modAction.type === "delete" && (
        <Drawer open onOpenChange={(open) => !open && setModAction(null)}>
          <DrawerContent className="max-h-[60vh]">
            <DrawerHeader>
              <DrawerTitle>Solicitar Exclusão</DrawerTitle>
              <DrawerDescription>
                Questão: Q-{String(modAction.question.public_id || "?").padStart(3, "0")} — {modAction.question.title}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-3">
              <Textarea
                placeholder="Justificativa para a exclusão (obrigatório)..."
                value={modJustification}
                onChange={(e) => setModJustification(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => modRequestMutation.mutate({
                    type: "delete",
                    questionId: modAction.question.id,
                    justification: modJustification,
                  })}
                  disabled={modRequestMutation.isPending || !modJustification.trim()}
                >
                  {modRequestMutation.isPending ? "Enviando..." : "Solicitar Exclusão"}
                </Button>
                <Button variant="outline" onClick={() => setModAction(null)}>Cancelar</Button>
              </div>
              <p className="text-xs text-muted-foreground">A questão só será excluída após aprovação de um administrador.</p>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}


function ContentTab() {
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("question_comments")
        .select("*, profiles(username, name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(30);
      const list = data || [];
      const ids = Array.from(new Set(list.map((c: any) => c.question_id).filter(Boolean)));
      let qmap: Record<string, any> = {};
      if (ids.length) {
        const { data: qs } = await supabase
          .from("weekly_questions")
          .select("id, public_id, is_weekly, title")
          .in("id", ids as string[]);
        qmap = Object.fromEntries((qs || []).map((q: any) => [q.id, q]));
      }
      return list.map((c: any) => ({ ...c, weekly_questions: qmap[c.question_id] || null }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("question_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast({ title: "Comentário removido." });
    },
  });

  return (
    <Card className="gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Comentários Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments?.map((c: any) => {
          const pid = c.weekly_questions?.public_id;
          const isWeekly = c.weekly_questions?.is_weekly;
          const code = pid ? `Q-${String(pid).padStart(3, "0")}` : null;
          const href = code ? (isWeekly ? `/semanal/${code}` : `/discursivas/${code}`) : `/discursivas/${c.question_id}`;
          return (
          <a
            key={c.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <Avatar className="h-7 w-7 mt-0.5">
              <AvatarImage src={c.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(c.profiles?.name || c.profiles?.username || "?")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">@{c.profiles?.username} <span className="text-muted-foreground">· Questão {code || c.question_id}</span>{c.weekly_questions?.title ? <span className="text-muted-foreground"> — {c.weekly_questions.title}</span> : null}</p>
              <p className="text-sm mt-1">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMutation.mutate(c.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </a>
          );
        })}
        {!comments?.length && <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário encontrado.</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Subjects Tab ─── */
function SubjectsTab() {
  const queryClient = useQueryClient();
  const { disciplines } = useDisciplines();
  const [selectedDiscipline, setSelectedDiscipline] = useState(disciplines[0] || "");
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingCategory, setEditingCategory] = useState("");

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["admin-discipline-subjects", selectedDiscipline],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_subjects")
        .select("*")
        .eq("discipline", selectedDiscipline)
        .order("sort_order", { ascending: true })
        .order("subject");
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique categories for autocomplete
  const existingCategories = [...new Set(subjects.filter((s: any) => s.category).map((s: any) => s.category))];

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = subjects.length > 0 ? Math.max(...subjects.map((s: any) => s.sort_order || 0)) : 0;
      const { error } = await (supabase.from("discipline_subjects") as any).insert({
        discipline: selectedDiscipline,
        subject: newSubject.trim(),
        category: newCategory.trim() || null,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discipline-subjects", selectedDiscipline] });
      setNewSubject("");
      toast({ title: "Assunto adicionado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder, swapId, swapOrder }: { id: string; newOrder: number; swapId: string; swapOrder: number }) => {
      const [r1, r2] = await Promise.all([
        (supabase.from("discipline_subjects") as any).update({ sort_order: newOrder }).eq("id", id),
        (supabase.from("discipline_subjects") as any).update({ sort_order: swapOrder }).eq("id", swapId),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discipline-subjects", selectedDiscipline] });
    },
    onError: (e: any) => toast({ title: "Erro ao reordenar", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, subject, category }: { id: string; subject: string; category: string }) => {
      const { error } = await (supabase.from("discipline_subjects") as any)
        .update({ subject: subject.trim(), category: category.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discipline-subjects", selectedDiscipline] });
      setEditingId(null);
      toast({ title: "Assunto atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discipline_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discipline-subjects", selectedDiscipline] });
      toast({ title: "Assunto removido." });
    },
  });

  // Group for display
  const grouped: Record<string, any[]> = {};
  const uncategorized: any[] = [];
  subjects.forEach((s: any) => {
    if (s.category) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    } else {
      uncategorized.push(s);
    }
  });

  const moveSubject = (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= subjects.length) return;
    const current = subjects[index] as any;
    const swap = subjects[swapIndex] as any;
    reorderMutation.mutate({
      id: current.id,
      newOrder: swap.sort_order,
      swapId: swap.id,
      swapOrder: current.sort_order,
    });
  };

  const renderSubjectRow = (s: any, index: number) => (
    <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
      {editingId === s.id ? (
        <>
          <Input
            value={editingCategory}
            onChange={(e) => setEditingCategory(e.target.value)}
            className="w-32 h-8 text-sm"
            placeholder="Categoria"
            list="categories-list"
          />
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="flex-1 h-8 text-sm"
            placeholder="Assunto"
            onKeyDown={(e) => e.key === "Enter" && editingValue.trim() && updateMutation.mutate({ id: s.id, subject: editingValue, category: editingCategory })}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateMutation.mutate({ id: s.id, subject: editingValue, category: editingCategory })} disabled={!editingValue.trim()}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-0.5">
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveSubject(index, "up")} disabled={index === 0 || reorderMutation.isPending}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveSubject(index, "down")} disabled={index === subjects.length - 1 || reorderMutation.isPending}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
          {s.category && (
            <Badge variant="outline" className="text-xs shrink-0">{s.category}</Badge>
          )}
          <span className="flex-1 text-sm">{s.subject}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => { setEditingId(s.id); setEditingValue(s.subject); setEditingCategory(s.category || ""); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Gerenciar Assuntos por Matéria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {disciplines.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <datalist id="categories-list">
            {existingCategories.map(c => <option key={c} value={c} />)}
          </datalist>

          <div className="flex gap-2">
            <Input
              placeholder="Categoria (opcional)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-40"
              list="categories-list"
            />
            <Input
              placeholder="Novo assunto..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && newSubject.trim() && addMutation.mutate()}
            />
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newSubject.trim() || addMutation.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum assunto cadastrado para {selectedDiscipline}.</p>
          ) : (
            <div className="space-y-1">
              {subjects.map((s: any, index: number) => renderSubjectRow(s, index))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


function UserTurmasSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");

  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ["admin-user-turmas", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turmas_acessos")
        .select("id, album_id, is_manual, created_at, turmas_albuns(titulo)")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: albuns = [] } = useQuery({
    queryKey: ["admin-all-albuns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_albuns")
        .select("id, titulo")
        .order("titulo");
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const { error } = await (supabase as any)
        .from("turmas_acessos")
        .insert({ user_id: userId, album_id: albumId, is_manual: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-turmas", userId] });
      setSelectedAlbum("");
      toast({ title: "Acesso concedido!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (acessoId: string) => {
      const { error } = await (supabase as any).from("turmas_acessos").delete().eq("id", acessoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-turmas", userId] });
      toast({ title: "Acesso removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const acessoAlbumIds = new Set(acessos.map((a: any) => a.album_id));
  const albunsDisponiveis = albuns.filter((a: any) => !acessoAlbumIds.has(a.id));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Turmas</h3>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : acessos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma turma com acesso.</p>
      ) : (
        <div className="space-y-2">
          {acessos.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm truncate">{a.turmas_albuns?.titulo || a.album_id}</span>
                <Badge variant={a.is_manual ? "secondary" : "default"} className="text-[10px]">
                  {a.is_manual ? "Manual" : "Compra"}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => removeMutation.mutate(a.id)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Remover
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma turma..." />
          </SelectTrigger>
          <SelectContent>
            {albunsDisponiveis.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-1.5">Nenhuma turma disponível</div>
            ) : (
              albunsDisponiveis.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.titulo}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={() => selectedAlbum && addMutation.mutate(selectedAlbum)}
          disabled={!selectedAlbum || addMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar acesso manual
        </Button>
      </div>
    </div>
  );
}

function UserSubscriptionInfo({ userId }: { userId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subData, isLoading } = useQuery({
    queryKey: ["admin-user-subscription", userId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${token}` },
        body: { user_id: userId },
      });
      if (error) throw error;
      return data as {
        subscribed: boolean;
        price_id?: string;
        product_id?: string;
        subscription_end?: string;
        manual?: boolean;
        plan_type?: string;
      };
    },
  });

  const grantMutation = useMutation({
    mutationFn: async ({ days, planType }: { days: number; planType: string }) => {
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      // Deactivate any existing manual sub first
      await supabase
        .from("manual_subscriptions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);
      const { error } = await supabase.from("manual_subscriptions").insert({
        user_id: userId,
        plan_type: planType,
        granted_by: user?.id,
        expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-subscription", userId] });
      toast({ title: "Plano atribuído com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("manual_subscriptions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-subscription", userId] });
      toast({ title: "Plano manual removido." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg bg-secondary/50 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    );
  }

  const plan = subData?.price_id ? getPlanByPriceId(subData.price_id) : null;
  const isSubscribed = subData?.subscribed ?? false;
  const isManual = subData?.manual ?? false;

  let daysRemaining = 0;
  let totalDays = 0;
  let progressPercent = 0;

  if (isSubscribed && subData?.subscription_end) {
    const endDate = new Date(subData.subscription_end);
    const now = new Date();
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (isManual) {
      if (subData.plan_type === "trial") totalDays = 3;
      else totalDays = daysRemaining > 90 ? 365 : daysRemaining > 30 ? 90 : 30;
    } else if (plan?.billingCycle === "monthly") totalDays = 30;
    else if (plan?.billingCycle === "quarterly") totalDays = 90;
    else if (plan?.billingCycle === "annual") totalDays = 365;
    else totalDays = 30;

    progressPercent = totalDays > 0 ? Math.round((daysRemaining / totalDays) * 100) : 0;
  }

  const isMutating = grantMutation.isPending || revokeMutation.isPending;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Assinatura</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {isSubscribed ? (
            <>
              {isManual && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-[10px]">
                  {subData?.plan_type === "trial" ? "Trial" : "Manual"}
                </Badge>
              )}
              {!isManual && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-[10px]">Stripe</Badge>
              )}
              <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-[10px]">Assinante</Badge>
            </>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">Gratuito</Badge>
          )}
        </div>
      </div>

      {isSubscribed && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plano</span>
            <span className="font-semibold">
              {isManual
                ? subData?.plan_type === "trial" ? "Teste (3 dias)" : "Premium (Manual)"
                : plan?.name ?? "Premium"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Vencimento
            </span>
            <span>{new Date(subData!.subscription_end!).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dias restantes</span>
              <span className="font-bold text-primary">{daysRemaining} dias</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-right">{progressPercent}% do ciclo restante</p>
          </div>
        </>
      )}

      {!isSubscribed && (
        <p className="text-xs text-muted-foreground">Este usuário não possui assinatura ativa.</p>
      )}

      <Separator />

      {/* Admin manual controls */}
      <div className="space-y-2">
        <p className="text-xs font-medium">Gestão Manual</p>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" disabled={isMutating}
            onClick={() => grantMutation.mutate({ days: 30, planType: "premium" })}>
            <Crown className="h-3 w-3 mr-1" />30 dias
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" disabled={isMutating}
            onClick={() => grantMutation.mutate({ days: 90, planType: "premium" })}>
            <Crown className="h-3 w-3 mr-1" />90 dias
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" disabled={isMutating}
            onClick={() => grantMutation.mutate({ days: 365, planType: "premium" })}>
            <Crown className="h-3 w-3 mr-1" />365 dias
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-orange-400 border-orange-400/30 hover:bg-orange-500/10" disabled={isMutating}
            onClick={() => grantMutation.mutate({ days: 3, planType: "trial" })}>
            <Clock className="h-3 w-3 mr-1" />Teste 3 dias
          </Button>
        </div>
        {(isSubscribed && isManual) && (
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10 w-full" disabled={isMutating}
            onClick={() => revokeMutation.mutate()}>
            <X className="h-3 w-3 mr-1" />Remover plano manual
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground">Planos via Stripe são gerenciados automaticamente.</p>
      </div>
    </div>
  );
}
