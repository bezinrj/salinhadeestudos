import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, CheckCircle2, Clock, BookOpen, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { getTurmaIcon } from "@/lib/turmasIcons";
import { useState, useMemo } from "react";
import { TurmaRanking } from "@/components/TurmaRanking";

type Album = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  cor: string | null;
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
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const isStaff = isAdmin || isModerator;
  const [rankingOpen, setRankingOpen] = useState(false);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState<string>("Todas");

  // Busca álbum e questões em paralelo — sem cascata
  const { data: album, isLoading: loadingAlbum } = useQuery({
    queryKey: ["turma-album", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
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

  const { data: temAcesso } = useQuery({
    queryKey: ["turma-acesso", id, user?.id],
    enabled: !!id && !!user?.id,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("turmas_acessos")
        .select("id")
        .eq("user_id", user!.id)
        .eq("album_id", id!)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: questoes = [] } = useQuery({
    queryKey: ["turma-questoes", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
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

  // Busca todas as respostas do álbum de uma vez — independente de questoes
  const { data: respondidasSet } = useQuery({
    queryKey: ["turma-respondidas-oficiais", id, user?.id],
    enabled: !!id && !!user?.id,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turmas_respostas")
        .select("question_id")
        .eq("user_id", user!.id)
        .eq("album_id", id!)
        .eq("is_study_attempt", false);
      if (error) throw error;
      return new Set((data || []).map((d: any) => d.question_id as string));
    },
  });


  if (loadingAlbum) {
    return <div className="container mx-auto px-4 py-8 text-muted-foreground">Carregando...</div>;
  }
  if (!album) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Turma não encontrada.</p>
        <Button onClick={() => navigate("/turmas")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  if (!temAcesso && !isStaff) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Lock className="h-12 w-12 mx-auto text-yellow-400" />
        <p className="text-muted-foreground">
          Você não possui acesso a esta turma. Adquira na página Minhas Turmas.
        </p>
        <Button onClick={() => navigate("/turmas")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Ir para Minhas Turmas
        </Button>
      </div>
    );
  }

  const Icon = getTurmaIcon(album.categoria?.icone);
  const cor = album.cor || album.categoria?.cor || "#6366f1";
  const albumTitulo = album.titulo;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/turmas">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para turmas
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRankingOpen(true)}
          className="text-white border-white/20 hover:bg-white/10"
        >
          <Trophy className="h-4 w-4 mr-2" /> Ranking
        </Button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-lg">
          {album.capa_url ? (
            <img src={album.capa_url} alt={album.titulo} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${cor}40, ${cor}10)` }}
            >
              <Icon className="h-20 w-20" style={{ color: cor }} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {album.categoria && (
            <Badge variant="outline" style={{ borderColor: `${cor}60`, color: cor }}>
              {album.categoria.nome}
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-bold">{album.titulo}</h1>
          {album.descricao && <p className="text-muted-foreground">{album.descricao}</p>}
          <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> {questoes.length} questões
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {album.questoes_por_liberacao} a cada {album.intervalo_dias} dias
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Questões</h2>
        {questoes.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma questão cadastrada nesta turma ainda.</p>
        ) : (
          <div className="space-y-2">
            {questoes.map((tq, i) => {
              const liberadoEm = new Date(tq.liberado_em);
              const liberado = liberadoEm.getTime() <= Date.now() || isStaff;
              const respondida = respondidasSet?.has(tq.question_id) ?? false;
              const q = tq.question;

              return (
                <motion.div
                  key={tq.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/40 transition-all"
                  style={{
                    borderColor: `${cor}33`,
                    boxShadow: `0 0 16px ${cor}1f, 0 0 32px ${cor}10`,
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ backgroundColor: `${cor}20`, color: cor }}
                  >
                    {tq.ordem}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{q?.title || "Questão removida"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {q?.discipline && <span>{q.discipline}</span>}
                      {q?.banca && <span> · {q.banca}</span>}
                      {q?.year && <span> · {q.year}</span>}
                      {q?.public_id && <span> · Q-{String(q.public_id).padStart(3, "0")}</span>}
                    </p>
                  </div>
                  {respondida && (
                    <Badge variant="outline" className="text-green-500 border-green-500/50 hidden sm:flex">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Respondida
                    </Badge>
                  )}
                  {liberado ? (
                    q ? (
                      <Button size="sm" asChild style={{ backgroundColor: cor }}>
                        <Link
                          to={`/turmas/${album.id}/questao/${tq.question_id}?titulo=${encodeURIComponent(albumTitulo)}&cor=${encodeURIComponent(cor)}&intervalo=${album.intervalo_dias}`}
                        >
                          Abrir
                        </Link>
                      </Button>
                    ) : null
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span className="hidden sm:inline">
                        Libera {liberadoEm.toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <TurmaRanking
        albumId={album.id}
        albumTitulo={albumTitulo}
        albumCor={cor}
        intervaloDias={album.intervalo_dias}
        open={rankingOpen}
        onOpenChange={setRankingOpen}
      />
    </div>
  );
}
