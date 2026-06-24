import { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { VmNotaPrivada } from "@/types/vademecum";
import { toast } from "sonner";
import { UnlockPremiumCard } from "./UnlockPremiumCard";

interface Props {
  artigoId: string;
  nota: VmNotaPrivada | undefined;
  subscribed?: boolean;
  onSave: (conteudo: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function PrivateNoteCard({ nota, subscribed = false, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nota?.conteudo ?? "");

  useEffect(() => {
    setValue(nota?.conteudo ?? "");
  }, [nota?.conteudo]);

  if (!nota && !editing) {
    if (!subscribed) {
      return <UnlockPremiumCard variant="private" />;
    }
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full rounded-lg border border-dashed border-pink-500/40 bg-pink-500/5 p-3 text-left text-xs text-pink-300 hover:bg-pink-500/10"
      >
        + Adicionar nota privada
      </button>
    );
  }

  if (editing) {
    return (
      <div className="rounded-lg border-l-4 border-pink-500 bg-pink-500/5 p-3">
        <div className="mb-2 flex items-center gap-1 text-xs font-bold text-pink-300">📍 Nota privada</div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="text-sm"
          placeholder="Suas anotações pessoais (só você vê)..."
        />
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            onClick={async () => {
              if (!value.trim()) return;
              await onSave(value.trim());
              setEditing(false);
              toast.success("Nota salva");
            }}
          >
            <Save className="mr-1 h-3 w-3" /> Salvar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue(nota?.conteudo ?? "");
              setEditing(false);
            }}
          >
            <X className="mr-1 h-3 w-3" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-lg border-l-4 border-pink-500 bg-pink-500/5 p-3">
      <div className="mb-1 flex items-center gap-1 text-xs font-bold text-pink-300">📍 Nota privada</div>
      <p className="whitespace-pre-wrap text-sm text-foreground/90">{nota!.conteudo}</p>
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete()}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
