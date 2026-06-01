import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VmNotaProfessor } from "@/types/vademecum";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  nota: VmNotaProfessor;
  canDelete: boolean;
  onDelete: () => void;
}

export function ProfessorNoteCard({ nota, canDelete, onDelete }: Props) {
  const ago = formatDistanceToNow(new Date(nota.created_at), { locale: ptBR, addSuffix: false });

  return (
    <div className="group relative rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-amber-300">Prof. {nota.autor_nome}</span>
        <span className="text-muted-foreground">{ago}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground/90">{nota.conteudo}</p>
      {canDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
    </div>
  );
}
