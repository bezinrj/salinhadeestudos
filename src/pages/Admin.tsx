import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/StatCard";
import { Shield, Users, MessageSquare, Bell, Eye, Trash2, Plus, Activity, Crown, GraduationCap, KeyRound, ChevronRight, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Verificando permissões...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold">Painel Administrativo</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Gerencie usuários, conteúdo e configurações do sistema.</p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="announcements">Avisos</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
        <TabsContent value="content"><ContentTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, comments, likes, sessions] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("question_comments").select("id", { count: "exact", head: true }),
        supabase.from("profile_likes").select("id", { count: "exact", head: true }),
        supabase.from("user_sessions").select("*"),
      ]);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const onlineUsers = (sessions.data || []).filter((s: any) => s.last_seen_at > fiveMinAgo);
      return {
        totalUsers: profiles.count || 0,
        totalComments: comments.count || 0,
        totalLikes: likes.count || 0,
        onlineNow: onlineUsers.length,
        onlineList: onlineUsers,
      };
    },
    refetchInterval: 30_000,
  });

  const { data: onlineProfiles } = useQuery({
    queryKey: ["admin-online-profiles", stats?.onlineList],
    queryFn: async () => {
      if (!stats?.onlineList?.length) return [];
      const ids = stats.onlineList.map((s: any) => s.user_id);
      const { data } = await supabase.from("profiles").select("*").in("id", ids);
      return data || [];
    },
    enabled: !!stats?.onlineList?.length,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Usuários" value={stats?.totalUsers ?? 0} icon={Users} variant="electric" />
        <StatCard title="Online Agora" value={stats?.onlineNow ?? 0} icon={Activity} variant="gold" />
        <StatCard title="Comentários" value={stats?.totalComments ?? 0} icon={MessageSquare} variant="purple" />
        <StatCard title="Total Likes" value={stats?.totalLikes ?? 0} icon={Eye} variant="default" />
      </div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Usuários Online Agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineProfiles?.length ? (
            <div className="space-y-3">
              {onlineProfiles.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{(p.name || p.username || "?")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name || p.username}</p>
                    <p className="text-xs text-muted-foreground">@{p.username}</p>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]">Online</Badge>
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

function UsersTab() {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"all" | "new" | "active">("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: sessions } = useQuery({
    queryKey: ["admin-all-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("user_sessions").select("*");
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
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

  const getUserRole = (userId: string) => {
    const r = (roles || []).find((r: any) => r.user_id === userId);
    return r?.role || "user";
  };

  const roleBadge = (role: string) => {
    if (role === "admin") return <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-[10px]"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
    if (role === "moderator") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-[10px]"><GraduationCap className="h-3 w-3 mr-1" />Professor</Badge>;
    return <Badge variant="outline" className="text-muted-foreground text-[10px]">Aluno</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar por nome ou username..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex gap-1">
          {(["all", "new", "active"] as const).map((t) => (
            <Button key={t} variant={subTab === t ? "default" : "outline"} size="sm" onClick={() => setSubTab(t)}>
              {t === "all" ? `Todos (${users?.length || 0})` : t === "new" ? `Novos (${(users || []).filter((u: any) => u.created_at > sevenDaysAgo).length})` : `Ativos (${onlineIds.size})`}
            </Button>
          ))}
        </div>
      </div>

      <Card className="gradient-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="hidden md:table-cell">Streak</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Cadastro</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u: any) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-secondary/80" onClick={() => setSelectedUser(u)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(u.name || u.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name || u.username}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{roleBadge(getUserRole(u.id))}</TableCell>
                <TableCell className="text-sm">{u.total_score ?? 0}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{u.streak ?? 0}🔥</TableCell>
                <TableCell className="hidden md:table-cell">
                  {onlineIds.has(u.id) ? (
                    <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]">Online</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">Offline</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filteredUsers.length && <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>}
      </Card>

      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          role={getUserRole(selectedUser.id)}
          isOnline={onlineIds.has(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function UserDetailDrawer({ user, role, isOnline, onClose }: { user: any; role: string; isOnline: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: userComments } = useQuery({
    queryKey: ["admin-user-comments", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("question_comments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      // Remove existing role
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      // Insert new role if not "user" (default)
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

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Ações</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Alterar Role</p>
                <Select defaultValue={role} onValueChange={(v) => roleMutation.mutate(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Aluno</SelectItem>
                    <SelectItem value="moderator">Professor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Senha</p>
                <Button variant="outline" className="w-full" onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Enviar Reset de Senha
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recent comments */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Comentários Recentes</h3>
            {userComments?.length ? userComments.map((c: any) => (
              <div key={c.id} className="p-2 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Questão {c.question_id} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                <p className="text-sm mt-1">{c.content}</p>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">Nenhum comentário.</p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">Cadastro: {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function AnnouncementsTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { data: announcements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_announcements").select("*").order("created_at", { ascending: false });
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
      return data || [];
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
        {comments?.map((c: any) => (
          <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <Avatar className="h-7 w-7 mt-0.5">
              <AvatarImage src={c.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(c.profiles?.name || c.profiles?.username || "?")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">@{c.profiles?.username} <span className="text-muted-foreground">· Questão {c.question_id}</span></p>
              <p className="text-sm mt-1">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => deleteMutation.mutate(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!comments?.length && <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário encontrado.</p>}
      </CardContent>
    </Card>
  );
}
