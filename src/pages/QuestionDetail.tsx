import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { questions, sampleCorrection } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const question = questions.find(q => q.id === id);
  if (!question) return <div className="text-center py-16 text-muted-foreground">Questão não encontrada.</div>;

  const correction = sampleCorrection;

  const handleSubmit = () => {
    if (answer.trim().length < 50) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/discursivas")} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>

      <Card className="gradient-card border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 text-[10px]">{question.career}</Badge>
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">{question.discipline}</Badge>
          </div>
          <CardTitle className="font-display text-xl">{question.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 leading-relaxed">{question.statement}</p>
        </CardContent>
      </Card>

      {!submitted ? (
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Sua Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Escreva ou cole sua resposta aqui... (mínimo 50 caracteres)"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="min-h-[250px] bg-secondary border-border resize-y text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{answer.length} caracteres</span>
              <Button onClick={handleSubmit} disabled={answer.trim().length < 50} className="gradient-electric text-white font-semibold">
                <Send className="h-4 w-4 mr-2" /> Enviar para correção
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Grade */}
          <Card className="gradient-card border-primary/20 glow-electric">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Nota Final</p>
              <p className="text-5xl font-display font-bold text-primary">{correction.grade}</p>
              <p className="text-sm text-muted-foreground">de {correction.maxGrade}</p>
              <Progress value={(correction.grade / correction.maxGrade) * 100} className="h-2 mt-4 max-w-xs mx-auto" />
            </CardContent>
          </Card>

          {/* Mirror */}
          <Card className="gradient-card border-border">
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">📋 Espelho Resumido</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed">{correction.mirror}</p></CardContent>
          </Card>

          {/* Positives */}
          <Card className="gradient-card border-green-500/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> Pontos Positivos</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {correction.positives.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <span className="text-green-400 mt-0.5">✓</span> {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Errors */}
          <Card className="gradient-card border-destructive/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> Erros</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {correction.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <span className="text-destructive mt-0.5">✗</span> {e}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Omissions */}
          <Card className="gradient-card border-yellow-500/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /> Omissões</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {correction.omissions.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <span className="text-yellow-400 mt-0.5">⚠</span> {o}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Ideal Answer */}
          <Card className="gradient-card border-primary/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Resposta Ideal</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed">{correction.idealAnswer}</p></CardContent>
          </Card>

          {/* Feedback */}
          <Card className="gradient-card border-gold/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gold mb-2">💡 Feedback de Melhoria</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{correction.feedback}</p>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => { setSubmitted(false); setAnswer(""); }} className="border-border">
            Responder novamente
          </Button>
        </motion.div>
      )}
    </div>
  );
}
