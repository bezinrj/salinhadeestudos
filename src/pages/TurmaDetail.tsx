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
        {(album as any).whatsapp_ativo && (album as any).whatsapp_url && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-white border-green-500/40 bg-green-600/20 hover:bg-green-600/40"
          >
            <a href={(album as any).whatsapp_url} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0012.05 0C5.5 0 .18 5.32.18 11.87a11.78 11.78 0 001.6 5.94L0 24l6.34-1.66a11.85 11.85 0 005.7 1.45h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.24-6.15-3.4-8.44zM12.05 21.6h-.01a9.7 9.7 0 01-4.95-1.36l-.36-.21-3.76.98 1-3.66-.23-.38a9.72 9.72 0 01-1.49-5.1c0-5.38 4.38-9.76 9.78-9.76a9.7 9.7 0 016.9 2.86 9.7 9.7 0 012.86 6.91c0 5.38-4.38 9.76-9.74 9.76zm5.62-7.31c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.21.31-.8 1-.98 1.21-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.54-.92-.82-1.55-1.83-1.73-2.14-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.7-1.69-.96-2.31-.25-.6-.51-.52-.7-.53l-.6-.01a1.15 1.15 0 00-.84.39c-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.4 5.39 4.77.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.83-.75 2.09-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.21-.59-.36z"/>
              </svg>
              Grupo WhatsApp
            </a>
          </Button>
        )}
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-semibold">Questões</h2>
          <span className="text-sm text-muted-foreground">
            {(() => {
              const filtradas = disciplinaFiltro === "Todas"
                ? questoes
                : questoes.filter((tq) => tq.question?.discipline === disciplinaFiltro);
              return `${filtradas.length} de ${questoes.length} questões`;
            })()}
          </span>
        </div>

        {(() => {
          const disciplinas = Array.from(
            new Set(questoes.map((tq) => tq.question?.discipline).filter(Boolean) as string[])
          ).sort();
          if (disciplinas.length <= 1) return null;
          const opcoes = ["Todas", ...disciplinas];
          return (
            <div className="flex flex-wrap gap-2 pt-1">
              {opcoes.map((disc) => {
                const ativo = disciplinaFiltro === disc;
                return (
                  <button
                    key={disc}
                    onClick={() => setDisciplinaFiltro(disc)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={
                      ativo
                        ? {
                            backgroundColor: cor,
                            color: "#fff",
                            borderColor: cor,
                            boxShadow: `0 0 12px ${cor}80, 0 0 24px ${cor}40`,
                          }
                        : {
                            backgroundColor: "transparent",
                            color: "hsl(var(--muted-foreground))",
                            borderColor: `${cor}40`,
                          }
                    }
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {questoes.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma questão cadastrada nesta turma ainda.</p>
        ) : (() => {
          const questoesFiltradas = disciplinaFiltro === "Todas"
            ? questoes
            : questoes.filter((tq) => tq.question?.discipline === disciplinaFiltro);

          if (questoesFiltradas.length === 0) {
            return <p className="text-muted-foreground">Nenhuma questão para esta disciplina.</p>;
          }

          return (
            <div className="space-y-2">
              {questoesFiltradas.map((tq, i) => {
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
          );
        })()}
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
