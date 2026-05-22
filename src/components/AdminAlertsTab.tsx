import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { AlertTriangle, Search, X, Image as ImageIcon, MessageSquare, ArrowUpDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  em_analise: { label: "Em análise", color: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
  procedente: { label: "Procedente", color: "bg-green-500/20 text-green-400 border-green-400/30" },
  improcedente: { label: "Improcedente", color: "bg-red-500/20 text-red-400 border-red-400/30" },
  corrigido: { label: "Corrigido", color: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30" },
};

const PROBLEM_MAP: Record<string, string> = {
  gabarito_errado: "Gabarito possivelmente errado",
  correcao_inconsistente: "Correção inconsistente",
  problema_enunciado: "Problema no enunciado",
  materia_errada: "Matéria/categoria errada",
  barema_incoerente: "Barema incoerente",
  erro_digitacao: "Erro de digitação ou formatação",
  outro: "Outro",
};

export default function AdminAlertsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "reports">("date");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [signedAttachmentUrl, setSignedAttachmentUrl] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    let active = true;
    setSignedAttachmentUrl(null);
    const path = selectedReport?.attachment_path || selectedReport?.attachment_url;
    if (selectedReport && path && !selectedReport.attachment_deleted_at) {
      supabase.storage
        .from("report-attachments")
        .createSignedUrl(path, 60 * 10)
        .then(({ data }) => {
          if (active && data?.signedUrl) setSignedAttachmentUrl(data.signedUrl);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedReport]);
  const [newStatus, setNewStatus] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-question-reports"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("question_reports" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      // Fetch question + user data
      const questionIds = [...new Set(data.map((r: any) => r.question_id))] as string[];
      const userIds = [...new Set(data.map((r: any) => r.user_id))] as string[];

      const [questionsRes, profilesRes] = await Promise.all([
        supabase.from("weekly_questions").select("id, title, public_id, statement").in("id", questionIds),
        supabase.from("profiles").select("id, username, name").in("id", userIds),
      ]);

      const qMap = new Map((questionsRes.data || []).map((q: any) => [q.id, q]));
      const pMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));

      return data.map((r: any) => ({
        ...r,
        question: qMap.get(r.question_id) || null,
        profile: pMap.get(r.user_id) || null,
      }));
    },
  });

  // Count reports per question for priority
  const reportCountByQuestion = reports.reduce((acc: Record<string, number>, r: any) => {
    acc[r.question_id] = (acc[r.question_id] || 0) + 1;
    return acc;
  }, {});

  const filtered = reports.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.problem_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const questionTitle = (r.question?.title || "").toLowerCase();
      const userName = (r.profile?.name || "").toLowerCase();
      const username = (r.profile?.username || "").toLowerCase();
      const publicId = r.question?.public_id ? `q-${String(r.question.public_id).padStart(3, "0")}` : "";
      return questionTitle.includes(q) || userName.includes(q) || username.includes(q) || publicId.includes(q);
    }
    return true;
  });

  if (sortBy === "reports") {
    filtered.sort((a: any, b: any) => (reportCountByQuestion[b.question_id] || 0) - (reportCountByQuestion[a.question_id] || 0));
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status: string; admin_note?: string }) => {
      const updateData: any = { status };
      if (admin_note !== undefined) updateData.admin_note = admin_note;

      // If finalizing, mark attachment for expiration
      if (["procedente", "improcedente", "corrigido"].includes(status)) {
        updateData.attachment_expires_at = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await (supabase.from("question_reports" as any) as any)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-reports"] });
      toast({ title: "Atualizado", description: "Reclamação atualizada com sucesso." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!selectedReport || !newStatus) return;
    updateMutation.mutate({
      id: selectedReport.id,
      status: newStatus,
      admin_note: adminNote || undefined,
    });
    setSelectedReport(null);
  };

  const openDetail = (report: any) => {
    setSelectedReport(report);
    setAdminNote(report.admin_note || "");
    setNewStatus(report.status);
  };

  const pendingCount = reports.filter((r: any) => r.status === "pendente").length;
  const highPriorityQuestions = Object.entries(reportCountByQuestion).filter(([, count]) => (count as number) >= 3);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="gradient-card border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="gradient-card border-orange-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-orange-400">{highPriorityQuestions.length}</p>
            <p className="text-xs text-muted-foreground">Alta prioridade</p>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{reports.filter((r: any) => r.attachment_url && !r.attachment_deleted_at).length}</p>
            <p className="text-xs text-muted-foreground">Com anexo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por questão, aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            {Object.entries(PROBLEM_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSortBy(s => s === "date" ? "reports" : "date")}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "date" ? "Data" : "Reclamações"}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhuma reclamação encontrada.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => {
            const count = reportCountByQuestion[r.question_id] || 0;
            const isHighPriority = count >= 3;
            return (
              <Card
                key={r.id}
                className={cn("gradient-card border-border cursor-pointer hover:border-primary/30 transition-colors", isHighPriority && "border-orange-500/30")}
                onClick={() => openDetail(r)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          Q-{r.question?.public_id ? String(r.question.public_id).padStart(3, "0") : "?"}
                        </span>
                        <Badge className={cn("text-[10px]", STATUS_MAP[r.status]?.color)}>
                          {STATUS_MAP[r.status]?.label}
                        </Badge>
                        {isHighPriority && (
                          <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-400/30">
                            🔥 {count} reclamações
                          </Badge>
                        )}
                        {r.attachment_url && !r.attachment_deleted_at && (
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{PROBLEM_MAP[r.problem_type] || r.problem_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        por {r.profile?.name || r.profile?.username || "—"} • {new Date(r.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer open={!!selectedReport} onOpenChange={(v) => { if (!v) setSelectedReport(null); }}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <DrawerTitle>Detalhes da Reclamação</DrawerTitle>
              </div>
              <DrawerClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button></DrawerClose>
            </div>
            <DrawerDescription>Analise e decida sobre esta reclamação.</DrawerDescription>
          </DrawerHeader>

          {selectedReport && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto">
              {/* Question info */}
              <Card className="gradient-card border-border">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Questão</p>
                  <p className="text-sm font-medium">
                    Q-{selectedReport.question?.public_id ? String(selectedReport.question.public_id).padStart(3, "0") : "?"} — {selectedReport.question?.title || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedReport.question?.statement}</p>
                </CardContent>
              </Card>

              {/* Reporter info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Aluno</p>
                  <p className="text-sm">{selectedReport.profile?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">@{selectedReport.profile?.username || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data</p>
                  <p className="text-sm">{new Date(selectedReport.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>

              {/* Problem details */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tipo do problema</p>
                <Badge className={cn("text-xs", STATUS_MAP[selectedReport.status]?.color)}>
                  {PROBLEM_MAP[selectedReport.problem_type] || selectedReport.problem_type}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                <p className="text-sm text-foreground/90 bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {/* Attachment */}
              {selectedReport.attachment_url && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Anexo
                    {selectedReport.attachment_deleted_at && (
                      <span className="text-red-400 ml-2">(removido em {new Date(selectedReport.attachment_deleted_at).toLocaleDateString("pt-BR")})</span>
                    )}
                  </p>
                  {!selectedReport.attachment_deleted_at ? (
                    <div className="space-y-2">
                      {signedAttachmentUrl ? (
                        <img src={signedAttachmentUrl} alt="Anexo" className="rounded-lg max-h-60 object-contain border border-border" />
                      ) : (
                        <div className="rounded-lg h-40 bg-secondary/50 animate-pulse" />
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{selectedReport.attachment_name}</span>
                        <span>({((selectedReport.attachment_size || 0) / 1024).toFixed(0)} KB)</span>
                        {signedAttachmentUrl && (
                          <a href={signedAttachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                            <ExternalLink className="h-3 w-3" /> Abrir
                          </a>
                        )}
                      </div>
                      {selectedReport.attachment_expires_at && (
                        <p className="text-[10px] text-yellow-400">
                          Expira em {new Date(selectedReport.attachment_expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Anexo removido automaticamente.</p>
                  )}
                </div>
              )}

              {/* Admin actions */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Observação interna</p>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Adicione uma observação interna..."
                    className="min-h-[80px]"
                  />
                </div>

                <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                  {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
