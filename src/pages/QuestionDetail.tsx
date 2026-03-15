import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { questions, weeklyQuestion, evaluateAnswer, addWeeklyScore, addRegularAnswer, hasAnsweredWeekly, getWeeklyAnswerScore, type CorrectionResult } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb, FileText, Send, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { QuestionComments } from "@/components/QuestionComments";

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, subscribed } = useAuth();
  const [answer, setAnswer] = useState("");
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);

  const question = [...questions, weeklyQuestion].find(q => q.id === id);
  if (!question) return <div className="text-center py-16 text-muted-foreground">Questão não encontrada.</div>;

  const isPremium = question.isPremium || question.isWeekly;
  const canAnswer = !isPremium || subscribed;

  const alreadyAnsweredWeekly = question.isWeekly && user ? hasAnsweredWeekly(user.id, question.id) : false;
  const previousWeeklyScore = question.isWeekly && user ? getWeeklyAnswerScore(user.id, question.id) : null;

  const handleSubmit = () => {
    if (answer.trim().length < 50) return;
    if (!question.barema) return;
    const result = evaluateAnswer(answer, question.barema);
    setCorrection(result);

    if (question.isWeekly && user) {
      // Weekly: adds to ranking (only once, enforced in addWeeklyScore)
      addWeeklyScore(user.id, question.id, result.grade, answer, result.feedback);
    } else if (user) {
      // Regular: only counts for badges/totalEssays, NOT ranking
      addRegularAnswer(user.id, question.id, result.grade);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-green-400";
    if (grade >= 6) return "text-primary";
    if (grade >= 4) return "text-yellow-400";
    return "text-destructive";
  };

  const getStatusIcon = (status: "full" | "partial" | "missed") => {
    if (status === "full") return <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />;
    if (status === "partial") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
  };

  const getStatusBg = (status: "full" | "partial" | "missed") => {
    if (status === "full") return "bg-green-500/5 border-green-500/20";
    if (status === "partial") return "bg-yellow-500/5 border-yellow-500/20";
    return "bg-destructive/5 border-destructive/20";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>

      <Card className="gradient-card border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 text-[10px]">{question.career}</Badge>
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">{question.discipline}</Badge>
            {question.isWeekly && <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">🏆 Questão da Semana</Badge>}
          </div>
          <CardTitle className="font-display text-xl">{question.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{question.statement}</p>
        </CardContent>
      </Card>

      {!correction ? (
        alreadyAnsweredWeekly ? (
        <Card className="gradient-card border-gold/20">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-10 w-10 text-gold mx-auto" />
            <p className="text-lg font-display font-bold">Você já respondeu esta questão da semana</p>
            {previousWeeklyScore !== null && (
              <p className="text-2xl font-display font-bold text-primary">{previousWeeklyScore.toFixed(1)} / 10</p>
            )}
            <p className="text-sm text-muted-foreground">Questões da semana só podem ser respondidas uma vez. Sua nota foi adicionada ao ranking.</p>
          </CardContent>
        </Card>
        ) : canAnswer ? (
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
        <Card className="gradient-card border-gold/20">
          <CardContent className="p-8 text-center space-y-4">
            <Lock className="h-10 w-10 text-gold mx-auto" />
            <p className="text-lg font-display font-bold">Questão exclusiva para assinantes</p>
            <p className="text-sm text-muted-foreground">Assine um plano para responder questões premium e participar dos desafios semanais.</p>
            <Button onClick={() => navigate("/meu-plano")} className="gradient-electric text-white font-semibold">
              Ver planos
            </Button>
          </CardContent>
        </Card>
        )
        ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Grade Card */}
          <Card className="gradient-card border-primary/20 glow-electric">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Nota Final</p>
              <p className={cn("text-5xl font-display font-bold", getGradeColor(correction.grade))}>{correction.grade.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">de {correction.maxGrade}</p>
              <Progress value={(correction.grade / correction.maxGrade) * 100} className="h-2 mt-4 max-w-xs mx-auto" />
              {question.isWeekly && (
                <p className="text-xs text-gold mt-3">🏆 Pontuação adicionada ao ranking semanal!</p>
              )}
            </CardContent>
          </Card>

          {/* Barema Breakdown */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-display">📊 Detalhamento por Item (Barema)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {correction.baremaBreakdown.map(item => (
                <div key={item.letter} className="rounded-lg border border-border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold font-display">
                        {item.letter}
                      </span>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <span className={cn("text-sm font-bold font-display", getGradeColor(item.earnedScore / item.maxScore * 10))}>
                      {item.earnedScore.toFixed(1)} / {item.maxScore.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(item.earnedScore / item.maxScore) * 100} className="h-1.5 mb-3" />
                  <div className="space-y-2">
                    {item.subitems.map((sub, i) => (
                      <div key={i} className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-xs", getStatusBg(sub.status))}>
                        {getStatusIcon(sub.status)}
                        <span className="flex-1 text-foreground/80">{sub.description}</span>
                        <span className={cn("font-bold shrink-0", sub.status === "full" ? "text-green-400" : sub.status === "partial" ? "text-yellow-400" : "text-destructive")}>
                          {sub.earnedScore.toFixed(1)}/{sub.maxScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mirror */}
          <Card className="gradient-card border-border">
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">📋 Espelho Resumido</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed">{correction.mirror}</p></CardContent>
          </Card>

          {/* Positives */}
          {correction.positives.length > 0 && correction.positives[0] !== "Nenhum ponto do espelho foi adequadamente abordado." && (
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
          )}

          {/* Errors */}
          {correction.errors.length > 0 && (
            <Card className="gradient-card border-destructive/20">
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> Erros / Abordagem Incompleta</CardTitle></CardHeader>
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
          )}

          {/* Omissions */}
          {correction.omissions.length > 0 && (
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
          )}

          {/* No points */}
          {correction.positives.length === 1 && correction.positives[0] === "Nenhum ponto do espelho foi adequadamente abordado." && (
            <Card className="gradient-card border-destructive/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-destructive font-medium">⚠️ Nenhum ponto do espelho foi adequadamente abordado na sua resposta.</p>
              </CardContent>
            </Card>
          )}

          {/* Ideal Answer */}
          <Card className="gradient-card border-primary/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Resposta Ideal</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{correction.idealAnswer}</p></CardContent>
          </Card>

          {/* Feedback */}
          <Card className="gradient-card border-gold/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gold mb-2">💡 Feedback de Melhoria</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{correction.feedback}</p>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => { setCorrection(null); setAnswer(""); }} className="border-border">
            Responder novamente
          </Button>
        </motion.div>
      )}

      {/* Comments section - always visible */}
      {id && <QuestionComments questionId={id} />}
    </div>
  );
}
