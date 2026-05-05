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
  const categoriaSemCat: Categoria = { id: "sem-categoria", nome: "Outros", cor: "#6366f1", icone: "BookOpen" };

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">Minhas Turmas</h1>
        </div>
        <p className="text-muted-foreground">
          Álbuns de questões liberadas progressivamente. Acesso exclusivo Premium.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando turmas...</p>
      ) : visibleAlbuns.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
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
              categoria={categoriaSemCat}
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
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${categoria.cor}20`, color: categoria.cor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold">{categoria.nome}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-card shadow-md hover:shadow-xl transition-all"
    >
      {album.capa_url ? (
        <img
          src={album.capa_url}
          alt={album.titulo}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${categoria.cor}40, ${categoria.cor}10)` }}
        >
          <Icon className="h-16 w-16" style={{ color: categoria.cor }} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {!isStaff && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-yellow-500/90 text-black border-0 font-semibold">
            Premium
          </Badge>
        </div>
      )}

      {!album.is_active && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive">Inativo</Badge>
        </div>
      )}

      {locked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
          <Lock className="h-8 w-8 text-yellow-400" />
          <span className="text-yellow-400 font-bold tracking-wider text-sm">PREMIUM</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow">
          {album.titulo}
        </h3>
        {album.descricao && (
          <p className="text-white/80 text-sm mt-1 line-clamp-2">
            {album.descricao}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (locked) {
    return (
      <Link to="/planos" className="block">
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
