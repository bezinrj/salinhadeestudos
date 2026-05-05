import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { getTurmaIcon } from "@/lib/turmasIcons";
import { Badge } from "@/components/ui/badge";

type Categoria = { id: string; nome: string; cor: string; icone: string };
type Album = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  categoria_id: string | null;
  questoes_por_liberacao: number;
  intervalo_dias: number;
  is_active: boolean;
};

export default function Turmas() {
  const { subscribed } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const isStaff = isAdmin || isModerator;

  const { data: categorias = [] } = useQuery({
    queryKey: ["turmas-categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("turmas_categorias").select("*").order("nome");
      if (error) throw error;
      return (data || []) as Categoria[];
    },
  });

  const { data: albuns = [], isLoading } = useQuery({
    queryKey: ["turmas-albuns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas_albuns")
        .select("id, titulo, descricao, capa_url, categoria_id, questoes_por_liberacao, intervalo_dias, is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Album[];
    },
  });

  const visibleAlbuns = isStaff ? albuns : albuns.filter((a) => a.is_active);
  const semCategoria = visibleAlbuns.filter((a) => !a.categoria_id);

  return (
    <div className="p-4 md:p-6 space-y-10 pb-24 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold">Minhas Turmas</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Álbuns de questões liberadas progressivamente. Acesso exclusivo Premium.
        </p>
      </motion.div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Carregando turmas...</p>
      ) : visibleAlbuns.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma turma disponível ainda.</p>
        </div>
      ) : (
        <>
          {categorias.map((cat) => {
            const items = visibleAlbuns.filter((a) => a.categoria_id === cat.id);
            if (items.length === 0) return null;
            return (
              <CategoriaSection
                key={cat.id}
                categoria={cat}
                albuns={items}
                subscribed={subscribed}
                isStaff={isStaff}
              />
            );
          })}
          {semCategoria.length > 0 && (
            <CategoriaSection
              categoria={{ id: "none", nome: "Sem categoria", cor: "#64748b", icone: "BookOpen" }}
              albuns={semCategoria}
              subscribed={subscribed}
              isStaff={isStaff}
            />
          )}
        </>
      )}
    </div>
  );
}

function CategoriaSection({
  categoria,
  albuns,
  subscribed,
  isStaff,
}: {
  categoria: Categoria;
  albuns: Album[];
  subscribed: boolean;
  isStaff: boolean;
}) {
  const Icon = getTurmaIcon(categoria.icone);
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${categoria.cor}20`, color: categoria.cor }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-display font-semibold text-foreground">{categoria.nome}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {albuns.map((album, i) => (
          <AlbumCard
            key={album.id}
            album={album}
            categoria={categoria}
            subscribed={subscribed}
            isStaff={isStaff}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function AlbumCard({
  album,
  categoria,
  subscribed,
  isStaff,
  index,
}: {
  album: Album;
  categoria: Categoria;
  subscribed: boolean;
  isStaff: boolean;
  index: number;
}) {
  const Icon = getTurmaIcon(categoria.icone);
  const locked = !subscribed && !isStaff;

  const cardInner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative cursor-pointer rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] bg-muted/40 overflow-hidden">
        {album.capa_url ? (
          <img
            src={album.capa_url}
            alt={album.titulo}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${categoria.cor}30, ${categoria.cor}10)` }}
          >
            <Icon className="h-12 w-12" style={{ color: categoria.cor }} />
          </div>
        )}
        {!album.is_active && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-[10px]">
            Inativo
          </Badge>
        )}
        {locked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1">
            <Lock className="h-6 w-6 text-accent" />
            <span className="text-[10px] text-accent font-semibold">PREMIUM</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{album.titulo}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {album.questoes_por_liberacao} q / {album.intervalo_dias}d
        </p>
      </div>
    </motion.div>
  );

  if (locked) {
    return (
      <Link to="/meu-plano" className="block">
        {cardInner}
      </Link>
    );
  }

  return (
    <Link to={`/turmas/${album.id}`} className="block">
      {cardInner}
    </Link>
  );
}
