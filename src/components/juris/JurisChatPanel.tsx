import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { JurisJulgado } from "@/types/juris";

interface Msg { role: "user" | "assistant"; content: string }

const SUGS = [
  "O que foi decidido?",
  "Quais princípios estão envolvidos?",
  "Quem é afetado?",
  "Explique em linguagem simples",
];

export function JurisChatPanel({ julgado }: { julgado: JurisJulgado }) {
  const [history, setHistory] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Pronto para responder suas dúvidas sobre este julgado. O que deseja saber?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [history, loading]);

  async function send(q: string) {
    const text = q.trim();
    if (!text || loading || blocked) return;
    const next: Msg[] = [...history, { role: "user", content: text }];
    setHistory(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("juris-chat", {
        body: { julgadoId: julgado.id, messages: next },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let msg = "Erro ao consultar o assistente.";
        try {
          const body = ctx?.body ? await new Response(ctx.body).json() : null;
          if (body?.error === "DAILY_LIMIT") {
            setBlocked(body.message);
            msg = body.message;
          } else if (body?.error === "PREMIUM_REQUIRED") {
            setBlocked(body.message);
            msg = body.message;
          } else if (body?.message) {
            msg = body.message;
          }
        } catch { /* ignore */ }
        toast.error(msg);
        setHistory((h) => [...h, { role: "assistant", content: msg }]);
      } else if (data?.reply) {
        setHistory((h) => [...h, { role: "assistant", content: data.reply }]);
        if (data.usage) setUsage(data.usage);
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Assistente IA</span>
        </div>
        {usage && (
          <span className="text-xs text-muted-foreground">
            {usage.count}/{usage.limit} hoje
          </span>
        )}
      </div>

      <div className="border-b border-border bg-primary/5 px-5 py-2 text-xs text-muted-foreground">
        💡 Respondo exclusivamente com base no conteúdo deste julgado.
      </div>

      {history.length === 1 && (
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {SUGS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div ref={msgsRef} className="max-h-[460px] min-h-[260px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {history.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                IA
              </div>
            )}
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">IA</div>
            <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Pensando...
            </div>
          </div>
        )}
      </div>

      {blocked ? (
        <div className="flex items-center gap-2 border-t border-border bg-destructive/10 px-5 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {blocked}
        </div>
      ) : (
        <div className="flex gap-2 border-t border-border p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Digite sua dúvida sobre este julgado..."
            rows={1}
            className="min-h-[44px] resize-none"
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
