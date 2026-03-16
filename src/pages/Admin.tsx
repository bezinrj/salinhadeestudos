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
import { Shield, Users, MessageSquare, Bell, Eye, Trash2, Plus, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  const { data: users } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
      if (search) query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar por nome ou username..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <Card className="gradient-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Discursivas</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u: any) => (
              <TableRow key={u.id}>
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
                <TableCell className="text-sm">{u.total_score ?? 0}</TableCell>
                <TableCell className="text-sm">{u.total_essays ?? 0}</TableCell>
                <TableCell className="text-sm">{u.streak ?? 0}🔥</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
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
