import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { evaluateAnswer, type CorrectionResult, type BaremaItem } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb, FileText, Send, Lock, Loader2, Copy, Share2, Flag, Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { QuestionComments } from "@/components/QuestionComments";
import { toast } from "@/hooks/use-toast";
import { useBadges } from "@/hooks/useBadges";
import { ReportQuestionDialog } from "@/components/ReportQuestionDialog";
import { AnswerFileUpload } from "@/components/AnswerFileUpload";
import { generateCorrectionReport } from "@/lib/generateCorrectionReport";

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, subscribed } = useAuth();
  const [answer, setAnswer] = useState("");
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);
  const [lockedScore, setLockedScore] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<"texto_manual" | "transcricao" | "correcao_direta">("texto_manual");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [answerForReport, setAnswerForReport] = useState<string>("");
  const { checkAndAward } = useBadges(user?.id);

  const { data: question, isLoading } = useQuery({
    queryKey: ["question-detail", id],
    queryFn: async () => {
      // Detect if the param is a Q-code (e.g. "Q-001") or a UUID
      const isQCode = id!.match(/^Q-(\d+)$/i);
      let data: any, error: any;
      if (isQCode) {
        const res = await (supabase.from("weekly_questions") as any).select("*").eq("public_id", parseInt(isQCode[1])).single();
        data = res.data; error = res.error;
      } else {
        const res = await supabase.from("weekly_questions").select("*").eq("id", id!).single();
        data = res.data; error = res.error;
      }
      if (error) throw error;
      return {
        id: data.id,
        publicId: (data as any).public_id as number,
        title: data.title,
        career: data.career as any,
        discipline: data.discipline,
        statement: data.statement,
        difficulty: data.difficulty as any,
        participants: (data as any).participants || 0,
        isWeekly: (data as any).is_weekly,
        isPremium: (data as any).is_premium || (data as any).is_weekly,
        deadline: data.deadline,
        barema: data.barema as unknown as BaremaItem[] | undefined,
        mirrorText: (data as any).mirror_text as string | null,
        idealAnswer: (data as any).ideal_answer as string | null,
        subject: (data as any).subject as string | null,
        banca: (data as any).banca as string | null,
        year: (data as any).year as number | null,
      };
    },
    enabled: !!id,
  });

  // Check if user already answered this weekly question
  const { data: existingAnswer } = useQuery({
    queryKey: ["weekly-answer-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_answers" as any)
        .select("score")
        .eq("user_id", user!.id)
        .eq("question_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user && !!question?.isWeekly,
  });

  useEffect(() => {
    if (existingAnswer) {
      setLockedScore((existingAnswer as any).score);
    }
  }, [existingAnswer]);

  if (isLoading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;
  if (!question) return <div className="text-center py-16 text-muted-foreground">Questão não encontrada.</div>;

  const isPremium = question.isPremium || question.isWeekly;
  const canAnswer = !isPremium || subscribed;
  const isLocked = question.isWeekly && lockedScore !== null;

  const handleSubmit = async (directImageBase64?: string, directMimeType?: string) => {
    const isDirect = !!directImageBase64;
    if (!isDirect && answer.trim().length < 50) return;
    if (!question.mirrorText && !question.idealAnswer) return;
    
    setIsEvaluating(true);
    const currentSubmissionType = isDirect ? "correcao_direta" : submissionType;
    let result: CorrectionResult;

    try {
      const body: any = {
        baremaText: question.mirrorText || undefined,
        gabarito: question.idealAnswer || undefined,
        statement: question.statement || undefined,
      };

      if (isDirect) {
        body.imageBase64 = directImageBase64;
        body.mimeType = directMimeType;
        body.directCorrection = true;
      } else {
        body.answer = answer;
      }

      const { data, error } = await supabase.functions.invoke('evaluate-answer', { body });

      if (error || data?.error) {
        console.warn("AI evaluation failed:", error || data?.error);
        toast({ title: "Erro na correção", description: data?.error || "Tente novamente.", variant: "destructive" });
        setIsEvaluating(false);
        return;
      } else {
        result = data as CorrectionResult;
      }
    } catch (err) {
      console.warn("AI evaluation error:", err);
      toast({ title: "Erro na correção", description: "Não foi possível corrigir. Tente novamente.", variant: "destructive" });
      setIsEvaluating(false);
      return;
    }

    // Persist the answer text for the report
    const reportText = isDirect 
      ? (result.answer || "[Correcao direta por imagem/PDF]")
      : answer;
    setAnswerForReport(reportText);
    setCorrection(result);
    setIsEvaluating(false);

    // Fetch current profile data for badge checks
    const { data: currentProfile } = await supabase.from("profiles").select("total_essays, weekly_hours, streak, rank_position, subscription_tier").eq("id", user!.id).single();

    if (user) {
      const insertData: any = {
        user_id: user.id,
        question_id: question.id,
        answer_text: isDirect ? "[Correção direta por imagem]" : answer,
        score: result.grade,
        submission_type: currentSubmissionType,
        direct_correction_used: isDirect,
      };

      if (isDirect && result.handwritingNote) {
        insertData.handwriting_legibility_note = result.handwritingNote;
        insertData.handwriting_legibility_level = result.handwritingLevel;
      }

      if (uploadedFileUrl) {
        insertData.uploaded_file_url = uploadedFileUrl;
      }

      const { error } = await (supabase.from("weekly_answers" as any) as any).insert(insertData);
      if (error && error.code === "23505") {
        // Already answered
      } else if (error) {
        toast({ title: "Erro ao salvar resposta", description: error.message, variant: "destructive" });
      } else {
        if (question.isWeekly) {
          setLockedScore(result.grade);
        }
        toast({ title: "Resposta registrada!", description: "Sua nota foi salva." });
      }

      const newTotal = (currentProfile?.total_essays ?? 0) + 1;
      await supabase
        .from("profiles")
        .update({ total_essays: newTotal })
        .eq("id", user.id);

      await checkAndAward({
        totalEssays: newTotal,
        lastScore: result.grade,
        answeredWeekly: question.isWeekly,
        rankPosition: currentProfile?.rank_position ?? 0,
        weeklyHours: currentProfile?.weekly_hours ?? 0,
        streak: currentProfile?.streak ?? 0,
        subscriptionTier: currentProfile?.subscription_tier,
      });
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    setAnswer(text);
    setSubmissionType("transcricao");
  };

  const handleDirectCorrection = (imageBase64: string, mimeType: string) => {
    handleSubmit(imageBase64, mimeType);
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
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">Q-{String(question.publicId).padStart(3, '0')}</span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-border"
            onClick={() => {
              const code = `Q-${String(question.publicId).padStart(3, '0')}`;
              const url = `${window.location.origin}/discursivas/${code}`;
              navigator.clipboard.writeText(url);
              toast({ title: "Link copiado!", description: `Link da questão ${code} copiado.` });
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copiar link
          </Button>
        </div>
      </div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-white border-white/20 bg-white/10 text-[10px]">{question.career}</Badge>
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">{question.discipline}</Badge>
            {question.subject && (
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                {question.subject}
              </Badge>
            )}
            {question.isWeekly && <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">🏆 Questão da Semana</Badge>}
          </div>
          <CardTitle className="font-display text-xl">{question.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{question.statement}</p>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 hover:text-yellow-400" onClick={() => setReportOpen(true)}>
            <Flag className="h-3.5 w-3.5" /> Reportar problema
          </Button>
        </CardContent>
      </Card>

      <ReportQuestionDialog
        questionId={question.id}
        questionTitle={question.title}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* Locked state - already answered weekly */}
      {isLocked && !correction ? (
        <Card className="gradient-card border-green-500/20">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
            <p className="text-lg font-display font-bold">Você já respondeu esta questão</p>
            <p className="text-3xl font-display font-bold text-primary">{Number(lockedScore).toFixed(1)} <span className="text-base text-muted-foreground">/ 10</span></p>
            <p className="text-sm text-muted-foreground">Questões semanais podem ser respondidas apenas uma vez. Sua nota já foi registrada no ranking.</p>
          </CardContent>
        </Card>
      ) : !correction ? (
        canAnswer ? (
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
              onChange={e => { setAnswer(e.target.value); setSubmissionType("texto_manual"); }}
              className="min-h-[250px] bg-secondary border-border resize-y text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{answer.length} caracteres</span>
              <Button onClick={() => handleSubmit()} disabled={answer.trim().length < 50 || isEvaluating} className="gradient-electric text-white font-semibold">
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Corrigindo com IA...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar para correção</>
                )}
              </Button>
            </div>

            {/* File upload section */}
            {user && (
              <AnswerFileUpload
                userId={user.id}
                questionId={question.id}
                onTranscriptionComplete={handleTranscriptionComplete}
                onDirectCorrection={handleDirectCorrection}
                onFileSelected={(name) => setUploadedFileName(name)}
                disabled={isEvaluating}
              />
            )}
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

          {/* Handwriting Legibility */}
          {correction.handwritingNote && (
            <Card className="gradient-card border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" /> Legibilidade da Escrita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/85 leading-relaxed">{correction.handwritingNote}</p>
                {correction.handwritingLevel && (
                  <Badge variant="outline" className={cn("mt-2 text-[10px]",
                    correction.handwritingLevel === "plenamente_legivel" && "border-green-500/30 text-green-400",
                    correction.handwritingLevel === "legivel_com_esforco" && "border-yellow-500/30 text-yellow-400",
                    correction.handwritingLevel === "prejudica_parcialmente" && "border-orange-500/30 text-orange-400",
                    correction.handwritingLevel === "compromete_correcao" && "border-red-500/30 text-red-400",
                  )}>
                    {correction.handwritingLevel === "plenamente_legivel" && "✅ Plenamente legível"}
                    {correction.handwritingLevel === "legivel_com_esforco" && "⚠️ Legível com esforço"}
                    {correction.handwritingLevel === "prejudica_parcialmente" && "🔶 Prejudica parcialmente"}
                    {correction.handwritingLevel === "compromete_correcao" && "🔴 Compromete a correção"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card className="gradient-card border-gold/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gold mb-2">💡 Feedback de Melhoria</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{correction.feedback}</p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            {!question.isWeekly && (
              <Button variant="outline" onClick={() => { setCorrection(null); setAnswer(""); setAnswerForReport(""); setSubmissionType("texto_manual"); setUploadedFileName(null); setUploadedFileUrl(null); }} className="border-border">
                Responder novamente
              </Button>
            )}
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
              onClick={() => {
                generateCorrectionReport({
                  question: {
                    publicId: question.publicId,
                    title: question.title,
                    career: question.career,
                    discipline: question.discipline,
                    subject: question.subject,
                    statement: question.statement,
                  },
                  correction,
                  submissionType,
                  answerText: answerForReport || answer || correction.answer || "[Sem resposta disponivel]",
                  uploadedFileName: uploadedFileName || (uploadedFileUrl ? "Arquivo enviado" : null),
                });
              }}
            >
              <Download className="h-4 w-4" /> Baixar relatório da correção
            </Button>
          </div>
        </motion.div>
      )}

      {/* Comments section - always visible */}
      {id && <QuestionComments questionId={id} />}
    </div>
  );
}
