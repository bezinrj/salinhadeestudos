import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { evaluateAnswer, type CorrectionResult, type BaremaItem } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  FileText, Send, Lock, Loader2, Download, Eye, Flag, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useBadges } from "@/hooks/useBadges";
import { ReportQuestionDialog } from "@/components/ReportQuestionDialog";
import { AnswerFileUpload } from "@/components/AnswerFileUpload";
import { generateCorrectionReport } from "@/lib/generateCorrectionReport";
import { generateAnswerKeyReport } from "@/lib/generateAnswerKeyReport";
import { TurmaRanking } from "@/components/TurmaRanking";
import { QuestionComments } from "@/components/QuestionComments";

export default function TurmaQuestaoDetail() {
  const { albumId, questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAndAward } = useBadges(user?.id);

  const [answer, setAnswer] = useState("");
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [submissionType, setSubmissionType] = useState<"texto_manual" | "transcricao" | "correcao_direta">("texto_manual");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [answerForReport, setAnswerForReport] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);

  const albumCor = searchParams.get("cor") || "#6366f1";
  const albumTitulo = searchParams.get("titulo") || "Turma";
  const albumIntervaloDias = parseInt(searchParams.get("intervalo") || "7");

  const { data: question, isLoading } = useQuery({
    queryKey: ["turma-questao-detail", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_questions")
        .select("id, public_id, title, career, discipline, subject, disciplines, subjects, statement, difficulty, banca, year, is_active, is_weekly, is_premium, participants, created_at, created_by, deadline, album_id")
        .eq("id", questionId!)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        publicId: (data as any).public_id as number,
        title: data.title,
        career: data.career,
        discipline: data.discipline,
        statement: data.statement,
        difficulty: data.difficulty,
        // Gabarito/espelho/barema são obtidos sob demanda via RPC protegida.

        subject: (data as any).subject as string | null,
        banca: (data as any).banca as string | null,
        year: (data as any).year as number | null,
      };
    },
    enabled: !!questionId,
  });

  const { data: respostaOficial, refetch: refetchResposta } = useQuery({
    queryKey: ["turma-resposta-check", albumId, questionId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("turmas_respostas")
        .select("id, score, gabarito_baixado_antes, created_at")
        .eq("album_id", albumId!)
        .eq("question_id", questionId!)
        .eq("user_id", user!.id)
        .eq("is_study_attempt", false)
        .maybeSingle();
      return data;
    },
    enabled: !!albumId && !!questionId && !!user,
  });

  const { data: gabaritoDownload } = useQuery({
    queryKey: ["turma-gabarito-check", albumId, questionId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("turmas_gabarito_downloads")
        .select("id")
        .eq("album_id", albumId!)
        .eq("question_id", questionId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!albumId && !!questionId && !!user,
  });

  const jaRespondeu = !!respostaOficial;
  const jabaixouGabarito = !!gabaritoDownload;

  const handleDownloadAnswerKey = async () => {
    if (!question) return;
    const { data: keyRows, error: keyError } = await (supabase as any).rpc("get_question_answer_key", {
      _question_id: question.id,
    });
    const key = Array.isArray(keyRows) ? keyRows[0] : keyRows;
    if (keyError || !key) {
      toast({ title: "Gabarito indisponível", description: "Não foi possível carregar o gabarito desta questão.", variant: "destructive" });
      return;
    }
    if (user && !jabaixouGabarito) {
      await (supabase as any).from("turmas_gabarito_downloads").insert({
        album_id: albumId,
        question_id: questionId,
        user_id: user.id,
      });
    }
    generateAnswerKeyReport({
      publicId: question.publicId,
      title: question.title,
      career: question.career as any,
      discipline: question.discipline,
      subject: question.subject,
      banca: question.banca,
      year: question.year,
      statement: question.statement,
      barema: key.barema,
      mirrorText: key.mirror_text,
      idealAnswer: key.ideal_answer,
    });
  };

  const handleSubmit = async (directImageBase64?: string, directMimeType?: string) => {
    const isDirect = !!directImageBase64;
    if (!isDirect && answer.trim().length < 50) return;

    setIsEvaluating(true);
    const currentSubmissionType = isDirect ? "correcao_direta" : submissionType;

    try {
      const body: any = {
        statement: question.statement || undefined,
        questionId: question.id,
      };

      if (isDirect) {
        body.imageBase64 = directImageBase64;
        body.mimeType = directMimeType;
        body.directCorrection = true;
      } else {
        body.answer = answer;
      }

      const { data, error } = await supabase.functions.invoke("evaluate-answer", { body });
      if (error || data?.error) {
        toast({ title: "Erro na correção", description: data?.error || "Tente novamente.", variant: "destructive" });
        setIsEvaluating(false);
        return;
      }

      const result = data as CorrectionResult;
      const reportText = isDirect ? (result.answer || "[Correção direta por imagem/PDF]") : answer;
      setAnswerForReport(reportText);
      setCorrection(result);
      setIsEvaluating(false);

      if (user) {
        const insertData: any = {
          album_id: albumId,
          question_id: questionId,
          user_id: user.id,
          resposta: isDirect ? "[Correção direta por imagem]" : answer,
          score: result.grade,
          is_study_attempt: isStudyMode,
          gabarito_baixado_antes: jabaixouGabarito,
        };

        const { error: insertError } = await (supabase as any)
          .from("turmas_respostas")
          .insert(insertData);

        if (insertError && insertError.code !== "23505") {
          toast({ title: "Erro ao salvar resposta", description: insertError.message, variant: "destructive" });
        } else if (!isStudyMode) {
          refetchResposta();
          if (!jabaixouGabarito) {
            toast({
              title: "⚖️ Resposta registrada no ranking!",
              description: "Sua nota foi salva. Como você respondeu antes de baixar o gabarito, a ⚖️ aparecerá no seu nome no ranking.",
            });
          } else {
            toast({
              title: "Resposta registrada!",
              description: "Sua nota foi salva no ranking desta turma.",
            });
          }
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("total_essays, weekly_hours, streak, rank_position, subscription_tier")
          .eq("id", user.id)
          .single();

        const newTotal = (profile?.total_essays ?? 0) + 1;
        await supabase.from("profiles").update({ total_essays: newTotal }).eq("id", user.id);
        await checkAndAward({
          totalEssays: newTotal,
          lastScore: result.grade,
          answeredWeekly: false,
          rankPosition: profile?.rank_position ?? 0,
          weeklyHours: profile?.weekly_hours ?? 0,
          streak: profile?.streak ?? 0,
          subscriptionTier: profile?.subscription_tier,
        });
      }
    } catch {
      toast({ title: "Erro na correção", description: "Não foi possível corrigir. Tente novamente.", variant: "destructive" });
      setIsEvaluating(false);
    }
  };

  const handleResponderNovamente = () => {
    setIsStudyMode(true);
    setCorrection(null);
    setAnswer("");
    setAnswerForReport("");
    setSubmissionType("texto_manual");
    setUploadedFileName(null);
    setUploadedFileUrl(null);
    toast({
      title: "Modo estudo ativado",
      description: "Você pode responder novamente para praticar. Esta tentativa não alterará sua pontuação no ranking.",
    });
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-green-400";
    if (grade >= 6) return "text-primary";
    if (grade >= 4) return "text-yellow-400";
    return "text-destructive";
  };

  const getStatusIcon = (status: "full" | "partial" | "missed") => {
    if (status === "full") return <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />;
    if (status === "partial") return <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />;
    return <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  };

  const getStatusBg = (status: "full" | "partial" | "missed") => {
    if (status === "full") return "bg-green-500/5 border-green-500/20";
    if (status === "partial") return "bg-yellow-500/5 border-yellow-500/20";
    return "bg-destructive/5 border-destructive/20";
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!question) return <div className="p-8 text-center text-muted-foreground">Questão não encontrada.</div>;

  const canDownloadAnswerKey = true;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          {isStudyMode && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400">
              📚 Modo Estudo — sem pontuação
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRankingOpen(true)}
          >
            <Trophy className="h-4 w-4" /> Ranking
          </Button>
          {canDownloadAnswerKey && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadAnswerKey}>
              <Download className="h-4 w-4" /> Gabarito
            </Button>
          )}
        </div>
      </div>

      {/* Card da questão com glow colorido da turma */}
      <div
        className="rounded-lg border bg-card p-6 space-y-4"
        style={{
          borderColor: `${albumCor}66`,
          boxShadow: `0 0 30px ${albumCor}40, 0 0 60px ${albumCor}20`,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {question.career}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {question.discipline}
          </Badge>
          {question.subject && (
            <Badge variant="outline" className="text-xs">
              {question.subject}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: `${albumCor}80`, color: albumCor }}
          >
            🎓 {albumTitulo}
          </Badge>
        </div>

        <h1 className="text-2xl font-display font-bold">{question.title}</h1>
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{question.statement}</p>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-2"
          onClick={() => setReportOpen(true)}
        >
          <Flag className="h-4 w-4" /> Reportar problema
        </Button>
      </div>

      {/* Já respondeu */}
      {jaRespondeu && !isStudyMode && !correction && (
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
            <h2 className="text-xl font-display font-bold">Você já respondeu esta questão</h2>
            <p className={cn("text-4xl font-display font-bold", getGradeColor(Number(respostaOficial.score)))}>
              {Number(respostaOficial.score).toFixed(1)}
              <span className="text-lg text-muted-foreground"> / 10</span>
            </p>
            {respostaOficial.gabarito_baixado_antes === false && (
              <p className="text-sm text-amber-400">
                ⚖️ Você respondeu antes de baixar o gabarito — seu perfil está marcado no ranking.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Sua nota já está registrada no ranking desta turma.
            </p>
            <Button variant="outline" onClick={handleResponderNovamente}>
              📚 Responder novamente (modo estudo)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário de resposta */}
      {(!jaRespondeu || isStudyMode) && !correction && (
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isStudyMode ? "📚 Modo Estudo — nova tentativa" : "Sua Resposta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite ou cole sua resposta aqui (mínimo 50 caracteres)..."
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setSubmissionType("texto_manual"); }}
              className="min-h-[250px] bg-secondary border-border resize-y text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{answer.length} caracteres</span>
              <Button
                onClick={() => handleSubmit()}
                disabled={answer.trim().length < 50 || isEvaluating}
                className="gradient-electric text-white font-semibold"
              >
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Corrigindo com IA...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> {isStudyMode ? "Corrigir (modo estudo)" : "Enviar para correção"}</>
                )}
              </Button>
            </div>

            {user && (
              <AnswerFileUpload
                userId={user.id}
                questionId={question.id}
                onTranscriptionComplete={(text) => { setAnswer(text); setSubmissionType("transcricao"); }}
                onDirectCorrection={(b64, mime) => handleSubmit(b64, mime)}
                onFileSelected={(name) => setUploadedFileName(name)}
                disabled={isEvaluating}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado da correção */}
      {correction && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="gradient-card border-primary/20 glow-electric">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Nota Final</p>
              <p className={cn("text-5xl font-display font-bold", getGradeColor(correction.grade))}>
                {correction.grade.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">de {correction.maxGrade}</p>
              <Progress value={(correction.grade / correction.maxGrade) * 100} className="h-2 mt-4 max-w-xs mx-auto" />
              {isStudyMode && (
                <p className="text-xs text-amber-400 mt-3">📚 Modo Estudo — esta nota não foi registrada no ranking</p>
              )}
            </CardContent>
          </Card>

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
                        <span className={cn("font-bold shrink-0",
                          sub.status === "full" ? "text-green-400" : sub.status === "partial" ? "text-yellow-400" : "text-destructive"
                        )}>
                          {sub.earnedScore.toFixed(1)}/{sub.maxScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">📋 Espelho Resumido</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed">{correction.mirror}</p></CardContent>
          </Card>

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

          <Card className="gradient-card border-primary/20">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Resposta Ideal</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{correction.idealAnswer}</p></CardContent>
          </Card>

          {correction.handwritingNote && (
            <Card className="gradient-card border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" /> Legibilidade da Escrita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/85 leading-relaxed">{correction.handwritingNote}</p>
              </CardContent>
            </Card>
          )}

          <Card className="gradient-card border-gold/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gold mb-2">💡 Feedback de Melhoria</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{correction.feedback}</p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={handleResponderNovamente} className="border-border">
              📚 Responder novamente (modo estudo)
            </Button>
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
              onClick={() => generateCorrectionReport({
                question: {
                  publicId: question.publicId,
                  title: question.title,
                  career: question.career as any,
                  discipline: question.discipline,
                  subject: question.subject,
                  statement: question.statement,
                },
                correction,
                submissionType,
                answerText: answerForReport || answer || correction.answer || "[Sem resposta disponível]",
                uploadedFileName: uploadedFileName || (uploadedFileUrl ? "Arquivo enviado" : null),
              })}
            >
              <Download className="h-4 w-4" /> Baixar relatório da correção
            </Button>
          </div>
        </motion.div>
      )}

      {questionId && (
        <ReportQuestionDialog
          questionId={questionId}
          questionTitle={question.title}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}

      {questionId && <QuestionComments questionId={questionId} />}

      <TurmaRanking
        albumId={albumId!}
        albumTitulo={albumTitulo}
        albumCor={albumCor}
        intervaloDias={albumIntervaloDias}
        open={rankingOpen}
        onOpenChange={setRankingOpen}
        questionId={albumIntervaloDias < 7 ? questionId : undefined}
        questionTitulo={question.title}
      />
    </div>
  );
}
