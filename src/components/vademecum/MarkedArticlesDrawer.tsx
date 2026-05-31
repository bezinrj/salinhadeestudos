import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { VmArtigo, VmProgresso } from "@/types/vademecum";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leiNome: string;
  artigos: VmArtigo[];
  progressoMap: Map<string, VmProgresso>;
}

export function MarkedArticlesDrawer({ open, onOpenChange, leiNome, artigos, progressoMap }: Props) {
  const marcados = artigos.filter((a) => progressoMap.get(a.id)?.marcado);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`vm-art-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Marcados em {leiNome}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {marcados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum artigo marcado.</p>
          ) : (
            marcados.map((a) => (
              <button
                key={a.id}
                onClick={() => scrollTo(a.id)}
                className="block w-full rounded-md border border-border bg-card p-2 text-left text-xs hover:bg-secondary"
              >
                <div className="font-semibold">{a.rotulo || `Art. ${a.numero}`}</div>
                <div className="line-clamp-2 text-muted-foreground">{a.texto}</div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
