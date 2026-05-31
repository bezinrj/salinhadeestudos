import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  artigoDestinoId: string | null;
}

export function RemissaoDrawer({ open, onOpenChange, artigoDestinoId }: Props) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["vm-remissao-destino", artigoDestinoId],
    enabled: !!artigoDestinoId && open,
    queryFn: async () => {
      const { data: art } = await sb.from("vm_artigos").select("*").eq("id", artigoDestinoId).single();
      if (!art) return null;
      const [parRes, leiRes] = await Promise.all([
        sb.from("vm_paragrafos").select("*").eq("artigo_id", art.id).order("ordem"),
        sb.from("vm_leis").select("*").eq("id", art.lei_id).single(),
      ]);
      return { artigo: art, paragrafos: parRes.data ?? [], lei: leiRes.data };
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>
            {data?.lei?.sigla} — {data?.artigo?.rotulo || `Art. ${data?.artigo?.numero}`}
          </SheetTitle>
        </SheetHeader>
        {data ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">{data.lei?.nome}</p>
            <div className="font-serif text-[15px] leading-relaxed text-foreground/90">
              <p>{data.artigo.texto}</p>
              {data.paragrafos.map((p: any) => (
                <p key={p.id} className="mt-2 pl-4">
                  {p.rotulo && <strong className="mr-1">{p.rotulo}</strong>}
                  {p.texto}
                </p>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                navigate(`/vademecum/${data.lei.id}`);
                onOpenChange(false);
                setTimeout(() => {
                  document.getElementById(`vm-art-${data.artigo.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
              }}
            >
              Ir para este artigo
            </Button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
