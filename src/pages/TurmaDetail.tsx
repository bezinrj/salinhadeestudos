import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { getTurmaIcon } from "@/lib/turmasIcons";

type Album = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  questoes_por_liberacao: number;
  intervalo_dias: number;
  data_inicio: string;
  is_active: boolean;
  categoria: { nome: string; cor: string; icone: string } | null;
};

type TurmaQuestao = {
  id: string;
  ordem: number;
  liberado_em: string;
  question_id: string;
  question: {
    id: string;
    public_id: number;
    title: string;
    discipline: string;
    subject: string | null;
    banca: string | null;
    year: number | null;
  } | null;
};

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscribed, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const isStaff = isAdmin || isModerator;

  const { data: album, isLoading: loadingAlbum } = useQuery({
    queryKey: ["turma-album", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_albuns")
        .select("*, categoria:turmas_categorias(nome, cor, icone)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Album | null;
    },
  });

  const { data: questoes = [] } = useQuery({
    queryKey: ["turma-questoes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_questoes")
        .select("id, ordem, liberado_em, question_id, question:weekly_questions(id, public_id, title, discipline, subject, banca, year)")
        .eq("album_id", id!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TurmaQuestao[];
    },
  });

  const { data: respondidas = [] } = useQuery({
    queryKey: ["turma-respondidas", id, user?.id],
    enabled: !!id && !!user?.id && questoes.length > 0,
    queryFn: async () => {
      const ids = questoes.map((q) => q.question_id);
      const { data, error } = await supabase
        .from("weekly_answers")
        .select("question_id")
        .eq("user_id", user!.id)
        .in("question_id", ids);
      if (error) throw error;
      return (data || []).map((d) => d.question_id);
    },
  });

  if (loadingAlbum) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!album) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Turma não encontrada.</p>
        <Button onClick={() => navigate("/turmas")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  if (!subscribed && !isStaff) {
    return (
      <div className="p-6 text-center space-y-4">
        <Lock className="h-12 w-12 text-accent mx-auto" />
        <p className="text-muted-foreground">Esta turma é exclusiva para assinantes Premium.</p>
        <Button onClick={() => navigate("/meu-plano")}>Ver planos</Button>
      </div>
    );
  }

  const Icon = getTurmaIcon(album.categoria?.icone);
  const cor = album.categoria?.cor || "#6366f1";

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <Link to="/turmas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para turmas
      </Link>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-5">
        <div className="w-full md:w-48 aspect-[3/4] rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
          {album.capa_url ? (
            <img src={album.capa_url} alt={album.titulo} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${cor}30, ${cor}10)` }}
            >
              <Icon className="h-16 w-16" style={{ color: cor }} />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {album.categoria && (
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${cor}60`, color: cor }}>
              {album.categoria.nome}
            </Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{album.titulo}</h1>
          {album.descricao && <p className="text-sm text-muted-foreground">{album.descricao}</p>}
          <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> {questoes.length} questões
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {album.questoes_por_liberacao} a cada {album.intervalo_dias} dias
            </span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-sm font-display font-semibold text-foreground/80 uppercase tracking-wider">Questões</h2>
        {questoes.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma questão cadastrada nesta turma ainda.</p>
        ) : (
          <div className="space-y-2">
            {questoes.map((tq, i) => {
              const liberadoEm = new Date(tq.liberado_em);
              const liberado = liberadoEm.getTime() <= Date.now() || isStaff;
              const respondida = respondidas.includes(tq.question_id);
              const q = tq.question;
              return (
                <motion.div
                  key={tq.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    liberado ? "border-border/50 bg-card hover:border-primary/40" : "border-border/30 bg-muted/30 opacity-70"
                  } transition-colors`}
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${cor}20`, color: cor }}
                  >
                    {tq.ordem}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {q?.title || "Questão removida"}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {q?.discipline && <span>{q.discipline}</span>}
                      {q?.banca && <span>· {q.banca}</span>}
                      {q?.year && <span>· {q.year}</span>}
                      {q?.public_id && <span>· Q-{String(q.public_id).padStart(3, "0")}</span>}
                    </div>
                  </div>
                  {respondida && (
                    <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" /> Respondida
                    </Badge>
                  )}
                  {liberado ? (
                    q ? (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/discursivas/${q.id}`}>Abrir</Link>
                      </Button>
                    ) : null
                  ) : (
                    <div className="text-right">
                      <Lock className="h-4 w-4 text-muted-foreground inline" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Libera {liberadoEm.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
