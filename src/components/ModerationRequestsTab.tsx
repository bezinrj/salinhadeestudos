import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Check, X, Eye, Clock, AlertTriangle, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ModerationRequestsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["moderation-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("moderation_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!data?.length) return [];

      const requesterIds = [...new Set(data.map((r: any) => r.requester_id))];
      const deciderIds = [...new Set(data.filter((r: any) => r.decided_by).map((r: any) => r.decided_by))];
      const questionIds = [...new Set(data.map((r: any) => r.question_id))];
      const allUserIds = [...new Set([...requesterIds, ...deciderIds])];

      const [profilesRes, questionsRes, keysRes] = await Promise.all([
        supabase.from("profiles").select("id, username, name, avatar_url").in("id", allUserIds),
        supabase.from("weekly_questions").select("id, title, statement, career, discipline, subject, public_id, banca, year, is_weekly, is_premium").in("id", questionIds),
        (supabase as any).rpc("admin_list_question_answer_keys"),
      ]);

      const keyMap = new Map(((keysRes?.data as any[]) || []).map((k: any) => [k.id, k]));
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      const questionMap = new Map((questionsRes.data || []).map((q: any) => [q.id, { ...q, mirror_text: keyMap.get(q.id)?.mirror_text ?? null, ideal_answer: keyMap.get(q.id)?.ideal_answer ?? null }]));


      return data.map((r: any) => ({
        ...r,
        requester: profileMap.get(r.requester_id),
        decider: profileMap.get(r.decided_by),
        question: questionMap.get(r.question_id),
      }));
    },
    refetchInterval: 30_000,
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, questionId, requestType, proposedData }: { id: string; status: "approved" | "rejected"; questionId: string; requestType: string; proposedData: any }) => {
      // Update request status
      const { error } = await (supabase.from("moderation_requests") as any)
        .update({ status, decided_by: user?.id, decided_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // If approved, execute the action
      if (status === "approved") {
        if (requestType === "delete") {
          const { error: delErr } = await supabase.from("weekly_questions").delete().eq("id", questionId);
          if (delErr) throw delErr;
        } else if (requestType === "edit" && proposedData) {
          const { error: updErr } = await (supabase.from("weekly_questions") as any)
            .update(proposedData)
            .eq("id", questionId);
          if (updErr) throw updErr;
        }
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-questions"] });
      queryClient.invalidateQueries({ queryKey: ["discursivas-questions"] });
      toast({ title: vars.status === "approved" ? "Solicitação aprovada!" : "Solicitação rejeitada." });
      setSelectedRequest(null);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = requests.filter((r: any) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 text-[10px]"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    if (status === "approved") return <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-[10px]"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-[10px]"><X className="h-3 w-3 mr-1" />Rejeitada</Badge>;
  };

  const typeBadge = (type: string) => {
    if (type === "edit") return <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30"><Pencil className="h-3 w-3 mr-1" />Edição</Badge>;
    return <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30"><Trash2 className="h-3 w-3 mr-1" />Exclusão</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h3 className="font-medium">Solicitações de Moderadores</h3>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          {(["pending", "all", "approved", "rejected"] as const).map((f) => (
            <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f)}>
              {f === "pending" ? "Pendentes" : f === "all" ? "Todas" : f === "approved" ? "Aprovadas" : "Rejeitadas"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length ? filtered.map((r: any) => (
          <Card key={r.id} className={cn("gradient-card border-border", r.status === "pending" && "border-yellow-400/30")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 mt-0.5">
                  <AvatarImage src={r.requester?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{(r.requester?.name || r.requester?.username || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium">@{r.requester?.username || "—"}</span>
                    {typeBadge(r.request_type)}
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono text-primary/60">Q-{String(r.question?.public_id || "?").padStart(3, "0")}</span>
                    {" · "}{r.question?.title || "Questão removida"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">"{r.justification}"</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                  {r.decided_by && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Decidido por @{r.decider?.username || "—"} em {new Date(r.decided_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setSelectedRequest(r)}>
                    <Eye className="h-3 w-3 mr-1" />Detalhes
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" className="h-7 text-[11px] px-2 bg-green-600 hover:bg-green-700" onClick={() => decideMutation.mutate({ id: r.id, status: "approved", questionId: r.question_id, requestType: r.request_type, proposedData: r.proposed_data })} disabled={decideMutation.isPending}>
                        <Check className="h-3 w-3 mr-1" />Aprovar
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => decideMutation.mutate({ id: r.id, status: "rejected", questionId: r.question_id, requestType: r.request_type, proposedData: r.proposed_data })} disabled={decideMutation.isPending}>
                        <X className="h-3 w-3 mr-1" />Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação {statusFilter !== "all" ? `${statusFilter === "pending" ? "pendente" : statusFilter === "approved" ? "aprovada" : "rejeitada"}` : ""} encontrada.</p>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedRequest && (
        <Drawer open onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {typeBadge(selectedRequest.request_type)}
                  {statusBadge(selectedRequest.status)}
                </div>
                <DrawerClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button></DrawerClose>
              </div>
              <DrawerTitle>Detalhes da Solicitação</DrawerTitle>
              <DrawerDescription>Solicitação de @{selectedRequest.requester?.username || "—"}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4 overflow-y-auto">
              {/* Requester info */}
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Moderador</p>
                <p className="text-sm font-medium">@{selectedRequest.requester?.username} ({selectedRequest.requester?.name})</p>
                <p className="text-[10px] text-muted-foreground">{new Date(selectedRequest.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              </div>

              {/* Justification */}
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Justificativa</p>
                <p className="text-sm">{selectedRequest.justification}</p>
              </div>

              {/* Question info */}
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Questão Afetada</p>
                <p className="text-sm font-medium font-mono text-primary/80">Q-{String(selectedRequest.question?.public_id || "?").padStart(3, "0")}</p>
                <p className="text-sm">{selectedRequest.question?.title}</p>
                <p className="text-xs text-muted-foreground">{selectedRequest.question?.career} · {selectedRequest.question?.discipline}</p>
              </div>

              {/* For edits, show diff */}
              {selectedRequest.request_type === "edit" && selectedRequest.proposed_data && selectedRequest.question && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Comparação de Alterações</p>
                  {Object.entries(selectedRequest.proposed_data).map(([key, newVal]: [string, any]) => {
                    const oldVal = (selectedRequest.question as any)?.[key];
                    if (oldVal === newVal) return null;
                    const fieldLabels: Record<string, string> = {
                      title: "Título", career: "Carreira", discipline: "Matéria", subject: "Assunto",
                      statement: "Enunciado", mirror_text: "Barema", ideal_answer: "Gabarito",
                      banca: "Banca", year: "Ano", is_weekly: "Semanal", is_premium: "Premium",
                    };
                    return (
                      <div key={key} className="rounded-lg border border-border overflow-hidden">
                        <div className="bg-secondary/50 px-3 py-1.5">
                          <p className="text-xs font-medium">{fieldLabels[key] || key}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-border">
                          <div className="p-3">
                            <p className="text-[10px] text-muted-foreground mb-1">Atual</p>
                            <p className="text-xs text-red-400">{String(oldVal ?? "—")}</p>
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] text-muted-foreground mb-1">Proposto</p>
                            <p className="text-xs text-green-400">{String(newVal ?? "—")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* For deletes, show question statement */}
              {selectedRequest.request_type === "delete" && selectedRequest.question && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider">Questão a ser excluída</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedRequest.question.statement?.substring(0, 500)}{(selectedRequest.question.statement?.length || 0) > 500 ? "..." : ""}</p>
                </div>
              )}

              {/* Decision info */}
              {selectedRequest.decided_by && (
                <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Decisão</p>
                  <p className="text-sm">Decidido por <strong>@{selectedRequest.decider?.username}</strong></p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedRequest.decided_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                </div>
              )}

              {/* Action buttons */}
              {selectedRequest.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => decideMutation.mutate({ id: selectedRequest.id, status: "approved", questionId: selectedRequest.question_id, requestType: selectedRequest.request_type, proposedData: selectedRequest.proposed_data })} disabled={decideMutation.isPending}>
                    <Check className="h-4 w-4 mr-2" />Aprovar Solicitação
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => decideMutation.mutate({ id: selectedRequest.id, status: "rejected", questionId: selectedRequest.question_id, requestType: selectedRequest.request_type, proposedData: selectedRequest.proposed_data })} disabled={decideMutation.isPending}>
                    <X className="h-4 w-4 mr-2" />Rejeitar Solicitação
                  </Button>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
