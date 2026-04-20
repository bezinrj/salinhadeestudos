import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Discipline = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type ChangeRequest = {
  id: string;
  discipline_id: string;
  requester_id: string;
  request_type: "edit" | "delete";
  justification: string;
  proposed_data: { name?: string } | null;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
};

export default function MateriasTab() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [editing, setEditing] = useState<Discipline | null>(null);
  const [editName, setEditName] = useState("");
  const [editJustification, setEditJustification] = useState("");

  const [deleting, setDeleting] = useState<Discipline | null>(null);
  const [deleteJustification, setDeleteJustification] = useState("");

  /* ── Queries ── */
  const { data: disciplines = [] } = useQuery({
    queryKey: ["admin-disciplines"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("disciplines")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Discipline[];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-discipline-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("discipline_change_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const reqs = (data || []) as ChangeRequest[];
      const userIds = [
        ...new Set(
          reqs.flatMap((r) => [r.requester_id, r.decided_by].filter(Boolean) as string[]),
        ),
      ];
      let profiles: any[] = [];
      if (userIds.length) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, username, name, avatar_url")
          .in("id", userIds);
        profiles = pData || [];
      }
      const map = new Map(profiles.map((p) => [p.id, p]));
      return reqs.map((r) => ({
        ...r,
        requester: map.get(r.requester_id),
        decider: r.decided_by ? map.get(r.decided_by) : null,
      }));
    },
  });

  const disciplineNameById = new Map(disciplines.map((d) => [d.id, d.name]));
  const pendingForDisciplineIds = new Set(
    requests.filter((r: any) => r.status === "pending").map((r: any) => r.discipline_id),
  );

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Informe o nome da matéria.");
      const maxOrder = disciplines.reduce((m, d) => Math.max(m, d.sort_order), 0);
      const { error } = await (supabase as any).from("disciplines").insert({
        name: trimmed,
        sort_order: maxOrder + 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Matéria criada com sucesso!" });
      setCreateOpen(false);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["admin-disciplines"] });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const adminEditMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const trimmed = editName.trim();
      if (!trimmed) throw new Error("Informe o nome da matéria.");
      const { error } = await (supabase as any)
        .from("disciplines")
        .update({ name: trimmed })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Matéria atualizada!" });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-disciplines"] });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const adminDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleting) return;
      const { error } = await (supabase as any)
        .from("disciplines")
        .delete()
        .eq("id", deleting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Matéria excluída." });
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["admin-disciplines"] });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const requestMutation = useMutation({
    mutationFn: async (args: {
      discipline: Discipline;
      type: "edit" | "delete";
      justification: string;
      proposed_data?: any;
    }) => {
      if (!args.justification.trim())
        throw new Error("Informe a justificativa para o Admin avaliar.");
      const { error } = await (supabase as any).from("discipline_change_requests").insert({
        discipline_id: args.discipline.id,
        requester_id: user?.id,
        request_type: args.type,
        justification: args.justification.trim(),
        proposed_data: args.proposed_data || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a análise de um Admin.",
      });
      if (vars.type === "edit") {
        setEditing(null);
        setEditJustification("");
      } else {
        setDeleting(null);
        setDeleteJustification("");
      }
      qc.invalidateQueries({ queryKey: ["admin-discipline-requests"] });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const decideMutation = useMutation({
    mutationFn: async (args: {
      req: ChangeRequest;
      decision: "approved" | "rejected";
    }) => {
      const { req, decision } = args;
      const { error } = await (supabase as any)
        .from("discipline_change_requests")
        .update({
          status: decision,
          decided_by: user?.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      if (error) throw error;

      if (decision === "approved") {
        if (req.request_type === "delete") {
          const { error: dErr } = await (supabase as any)
            .from("disciplines")
            .delete()
            .eq("id", req.discipline_id);
          if (dErr) throw dErr;
        } else if (req.request_type === "edit" && req.proposed_data?.name) {
          const { error: uErr } = await (supabase as any)
            .from("disciplines")
            .update({ name: req.proposed_data.name })
            .eq("id", req.discipline_id);
          if (uErr) throw uErr;
        }
      }
    },
    onSuccess: (_, vars) => {
      toast({
        title:
          vars.decision === "approved" ? "Solicitação aprovada!" : "Solicitação rejeitada.",
      });
      qc.invalidateQueries({ queryKey: ["admin-discipline-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-disciplines"] });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  /* ── Handlers ── */
  const openEdit = (d: Discipline) => {
    setEditing(d);
    setEditName(d.name);
    setEditJustification("");
  };

  const openDelete = (d: Discipline) => {
    setDeleting(d);
    setDeleteJustification("");
  };

  const submitEdit = () => {
    if (isAdmin) {
      adminEditMutation.mutate();
    } else if (editing) {
      const trimmed = editName.trim();
      if (!trimmed || trimmed === editing.name) {
        toast({
          title: "Sem alterações",
          description: "Altere o nome antes de enviar a solicitação.",
          variant: "destructive",
        });
        return;
      }
      requestMutation.mutate({
        discipline: editing,
        type: "edit",
        justification: editJustification,
        proposed_data: { name: trimmed },
      });
    }
  };

  const submitDelete = () => {
    if (isAdmin) {
      adminDeleteMutation.mutate();
    } else if (deleting) {
      requestMutation.mutate({
        discipline: deleting,
        type: "delete",
        justification: deleteJustification,
      });
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Matérias</h3>
          <Badge variant="outline" className="text-[10px]">
            {disciplines.length} cadastrada{disciplines.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova matéria
        </Button>
      </div>

      {!isAdmin && isModerator && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-400/30 bg-yellow-500/5 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Como <strong>Moderador</strong>, você pode criar matérias diretamente. Edições e
            exclusões serão enviadas como solicitação para um Admin aprovar.
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {disciplines.length ? (
          disciplines.map((d) => {
            const hasPending = pendingForDisciplineIds.has(d.id);
            return (
              <Card
                key={d.id}
                className={cn(
                  "gradient-card border-border",
                  hasPending && "border-yellow-400/40",
                )}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Criada em{" "}
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {hasPending && (
                      <Badge className="mt-1.5 bg-yellow-500/20 text-yellow-400 border-yellow-400/30 text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />
                        Solicitação pendente
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(d)}
                      title={isAdmin ? "Editar" : "Solicitar edição"}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDelete(d)}
                      title={isAdmin ? "Excluir" : "Solicitar exclusão"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="col-span-full text-sm text-muted-foreground text-center py-8">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </div>

      {/* Solicitações - só Admin */}
      {isAdmin && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium">Solicitações de Moderadores</h4>
            {pendingRequests.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 text-[10px]">
                {pendingRequests.length} pendente{pendingRequests.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {requests.length ? (
            <div className="space-y-2">
              {requests.map((r: any) => (
                <Card
                  key={r.id}
                  className={cn(
                    "gradient-card border-border",
                    r.status === "pending" && "border-yellow-400/30",
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarImage src={r.requester?.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {(r.requester?.name || r.requester?.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">
                            @{r.requester?.username || "—"}
                          </span>
                          {r.request_type === "edit" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-blue-400 border-blue-400/30"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edição
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-red-400 border-red-400/30"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Exclusão
                            </Badge>
                          )}
                          {r.status === "pending" && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 text-[10px]">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                          {r.status === "approved" && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-[10px]">
                              <Check className="h-3 w-3 mr-1" />
                              Aprovada
                            </Badge>
                          )}
                          {r.status === "rejected" && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-[10px]">
                              <X className="h-3 w-3 mr-1" />
                              Rejeitada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Matéria:{" "}
                          <span className="font-medium text-foreground">
                            {disciplineNameById.get(r.discipline_id) || "—"}
                          </span>
                          {r.request_type === "edit" && r.proposed_data?.name && (
                            <>
                              {" → "}
                              <span className="text-green-400">
                                {r.proposed_data.name}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-xs italic text-muted-foreground mt-1">
                          "{r.justification}"
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })}
                        </p>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2 bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              decideMutation.mutate({ req: r, decision: "approved" })
                            }
                            disabled={decideMutation.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() =>
                              decideMutation.mutate({ req: r, decision: "rejected" })
                            }
                            disabled={decideMutation.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma solicitação registrada.
            </p>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova matéria</DialogTitle>
            <DialogDescription>
              Cadastre uma nova matéria (disciplina raiz). O nome deve ser único.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Ex: Direito Penal"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate(newName)}
              disabled={createMutation.isPending || !newName.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? "Editar matéria" : "Solicitar edição de matéria"}
            </DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "A alteração será aplicada imediatamente."
                : "Sua solicitação será analisada por um Admin antes de ser aplicada."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome da matéria</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da matéria"
              />
            </div>
            {!isAdmin && (
              <div>
                <label className="text-xs text-muted-foreground">
                  Justificativa (obrigatória)
                </label>
                <Textarea
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  placeholder="Explique brevemente o motivo da alteração..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitEdit}
              disabled={
                adminEditMutation.isPending ||
                requestMutation.isPending ||
                !editName.trim() ||
                (!isAdmin && !editJustification.trim())
              }
            >
              {isAdmin ? "Salvar" : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin ? "Excluir matéria?" : "Solicitar exclusão de matéria?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? `A matéria "${deleting?.name}" será excluída permanentemente.`
                : `Sua solicitação para excluir "${deleting?.name}" será enviada a um Admin.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isAdmin && (
            <Textarea
              value={deleteJustification}
              onChange={(e) => setDeleteJustification(e.target.value)}
              placeholder="Justificativa (obrigatória)..."
              rows={3}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDelete}
              disabled={
                adminDeleteMutation.isPending ||
                requestMutation.isPending ||
                (!isAdmin && !deleteJustification.trim())
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAdmin ? "Excluir" : "Enviar solicitação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
