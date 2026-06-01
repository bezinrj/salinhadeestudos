import { useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useVmComentarios } from "@/hooks/useVademecumExtras";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function ArticleComments({ artigoId }: { artigoId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const { comentarios, create, remove } = useVmComentarios(artigoId);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await create.mutateAsync({ conteudo: text.trim() });
      setText("");
      toast.success("Comentário enviado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao comentar");
    }
  };

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
        <span className="text-primary">{open ? "ocultar" : "ver"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comentarios.map((c) => {
            const canDel = c.user_id === user?.id || isAdmin || isModerator;
            return (
              <div key={c.id} className="flex gap-2 rounded-md bg-secondary/40 p-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={c.autor_avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{c.autor_nome?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{c.autor_nome}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.conteudo}</p>
                </div>
                {canDel && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => remove.mutate(c.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}

          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="text-sm"
            />
            <Button size="sm" onClick={submit} disabled={create.isPending}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
