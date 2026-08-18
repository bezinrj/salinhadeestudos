import { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VmNotaProfessor } from "@/types/vademecum";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { NoteContent } from "./NoteContent";
import { NoteEditor, isNoteEmpty } from "./NoteEditor";

interface Props {
  nota: VmNotaProfessor;
  canDelete: boolean;
  onDelete: () => void;
  onUpdate?: (conteudo: string) => Promise<void> | void;
}

export function ProfessorNoteCard({ nota, canDelete, onDelete, onUpdate }: Props) {
  const ago = formatDistanceToNow(new Date(nota.created_at), { locale: ptBR, addSuffix: false });
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nota.conteudo);

  useEffect(() => {
    setValue(nota.conteudo);
  }, [nota.conteudo]);

  return (
    <div className="group relative rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-amber-300">Prof. {nota.autor_nome}</span>
        <span className="text-muted-foreground">{ago}</span>
      </div>

      {editing ? (
        <>
          <NoteEditor
            key={nota.id}
            value={value}
            onChange={setValue}
            placeholder="Comentário do professor visível para todos os alunos..."
          />
          <div className="mt-2 flex gap-1">
            <Button
              size="sm"
              onClick={async () => {
                if (isNoteEmpty(value)) return;
                await onUpdate?.(value);
                setEditing(false);
                toast.success("Nota atualizada");
              }}
            >
              <Save className="mr-1 h-3 w-3" /> Salvar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValue(nota.conteudo);
                setEditing(false);
              }}
            >
              <X className="mr-1 h-3 w-3" /> Cancelar
            </Button>
          </div>
        </>
      ) : (
        <NoteContent content={nota.conteudo} />
      )}

      {canDelete && !editing && (
        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onUpdate && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
