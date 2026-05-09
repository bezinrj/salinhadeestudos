import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  nome: string;
  cargo: string;
  texto: string;
  estrelas: number;
  avatar_url: string | null;
}

export function HomeFeedbacksCarousel() {
  const [items, setItems] = useState<Feedback[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("feedbacks")
        .select("id, nome, cargo, texto, estrelas, avatar_url")
        .eq("publico", true)
        .eq("aprovado", true)
        .eq("exibir_carrossel", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setItems((data as Feedback[]) || []);
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
          O que dizem nossos <span className="text-primary">alunos</span>
        </h2>
        <p className="text-muted-foreground">Histórias reais de quem estuda na Salinha</p>
      </div>

      <Carousel opts={{ align: "start", loop: items.length > 2 }} className="max-w-5xl mx-auto">
        <CarouselContent>
          {items.map((f) => (
            <CarouselItem key={f.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="gradient-card border-border h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarImage src={f.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                        {f.nome[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{f.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.cargo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={cn("h-4 w-4", n <= f.estrelas ? "fill-gold text-gold" : "text-muted-foreground")} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed flex-1">"{f.texto}"</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );
}
