import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LifeBuoy, Mail, Phone, CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { getAnyPlanName } from "@/lib/stripe";

const SUBJECTS = [
  "Cancelar assinatura",
  "Problema com pagamento / cobrança indevida",
  "Dificuldade de acesso ou login",
  "Erro ou bug na plataforma",
  "Dúvida sobre conteúdo ou correção",
  "Sugestão de melhoria",
  "Parcerias e cupons",
  "Outro assunto",
];

const CANCEL_REASONS = [
  "Preço acima do que posso pagar",
  "Não estou usando a plataforma",
  "Encontrei outro serviço",
  "Já alcancei meu objetivo",
  "Dificuldade de uso",
  "Outro motivo",
];

const FAQ = [
  {
    q: "Como cancelo minha assinatura?",
    a: "Envie o formulário com o assunto “Cancelar assinatura”. Nossa equipe processa o pedido e confirma por e-mail em até 48 horas úteis.",
  },
  {
    q: "Perco o acesso na hora que peço o cancelamento?",
    a: "Não. O acesso continua liberado até o fim do período já pago. Depois disso, a renovação simplesmente não acontece.",
  },
  {
    q: "Como troco de plano?",
    a: "Peça a troca por aqui informando o plano desejado. Ajustamos o valor proporcional ao tempo restante do plano atual.",
  },
  {
    q: "Como emito recibo ou nota da compra?",
    a: "Solicite pelo formulário com o assunto “Problema com pagamento / cobrança indevida” e enviaremos o comprovante para o seu e-mail.",
  },
];

export default function FaleConosco() {
  const { user, profile } = useAuth();
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [retentionSeen, setRetentionSeen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sentProtocol, setSentProtocol] = useState<string | null>(null);

  const isCancel = subject === "Cancelar assinatura";
  const planLabel = useMemo(
    () => getAnyPlanName(profile?.price_id) || profile?.subscription_tier || "Gratuito",
    [profile]
  );

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_my_phone");
      if (data) setWhatsapp(data as string);
    })();
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!subject) return toast({ title: "Escolha o assunto", variant: "destructive" });
    if (message.trim().length < 10) return toast({ title: "Descreva sua solicitação com um pouco mais de detalhe.", variant: "destructive" });
    if (isCancel && !retentionSeen) return setRetentionSeen(true);
    if (isCancel && !cancelReason) return toast({ title: "Informe o motivo do cancelamento", variant: "destructive" });

    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject,
        message: message.trim(),
        cancel_reason: isCancel ? cancelReason : null,
        email: email || null,
        whatsapp: whatsapp || null,
        plan_label: planLabel,
      })
      .select("id")
      .single();
    setSaving(false);

    if (error) {
      toast({ title: "Não foi possível enviar", description: error.message, variant: "destructive" });
      return;
    }

    const protocol = String(data.id).slice(0, 8).toUpperCase();
    setSentProtocol(protocol);

    if (email) {
      supabase.functions.invoke("send-support-ticket-email", {
        body: { ticketId: data.id },
      });
    }

  };

  if (sentProtocol) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="gradient-card border-primary/30">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-xl font-display font-bold">Solicitação enviada!</h1>
            <p className="text-sm text-muted-foreground">
              Protocolo <span className="font-mono text-foreground">{sentProtocol}</span>. Respondemos em até 48 horas úteis
              {email ? <> no e-mail <span className="text-foreground">{email}</span></> : null}.
            </p>
            <Button variant="outline" onClick={() => { setSentProtocol(null); setMessage(""); setSubject(""); setCancelReason(""); setRetentionSeen(false); }}>
              Enviar outra solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold">Fale Conosco</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Dúvidas, sugestões, problemas de pagamento ou cancelamento — nossa equipe responde em até 48 horas úteis.
        </p>
      </motion.div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Sua solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Assunto</Label>
            <Select value={subject} onValueChange={(v) => { setSubject(v); setRetentionSeen(false); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o assunto" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isCancel && retentionSeen && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium">Antes de concluir…</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Seu acesso continua liberado até o fim do período já pago.</li>
                <li>Podemos pausar sua assinatura por até 60 dias em vez de cancelar.</li>
                <li>Se o motivo for preço, conseguimos avaliar um desconto no plano anual.</li>
              </ul>
              <div className="space-y-2">
                <Label>Motivo do cancelamento</Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    {CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conte o que aconteceu ou o que você precisa." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />E-mail para resposta</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Badge variant="outline" className="text-[11px]">Plano atual: {planLabel}</Badge>
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
              {saving ? "Enviando..." : isCancel && !retentionSeen ? <>Continuar <ChevronRight className="h-4 w-4" /></> : "Enviar solicitação"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border">
        <CardHeader><CardTitle className="text-base">Perguntas frequentes</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
