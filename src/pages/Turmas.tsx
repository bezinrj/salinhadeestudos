import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, BookOpen, ShoppingCart, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { getTurmaIcon } from "@/lib/turmasIcons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

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
type Plano = {
  id: string;
  nome: string;
  valor: number;
  price_id_stripe: string;
  meses_banco_geral: number;
  album_ids: string[];
};

export default function Turmas() {
  const { user, isAuthenticated } = useAuth();
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
    staleTime: 10 * 60_000,
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
    staleTime: 5 * 60_000,
  });

  const { data: planos = [] } = useQuery({
    queryKey: ["turmas-planos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turmas_planos")
        .select("id, nome, valor, price_id_stripe, meses_banco_geral, album_ids")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as Plano[];
    },
    staleTime: 10 * 60_000,
  });

  const { data: acessos = [] } = useQuery({
    queryKey: ["turmas-acessos", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turmas_acessos")
        .select("album_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((a: any) => a.album_id) as string[];
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
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
          Turmas de questões liberadas progressivamente. Adquira sua turma e estude com foco.
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
                planos={planos}
                acessos={acessos}
                isStaff={isStaff}
                isAuthenticated={isAuthenticated}
              />
            );
          })}
          {semCategoria.length > 0 && (
            <CategoriaSection
              categoria={categoriaSemCat}
              albuns={semCategoria}
              planos={planos}
              acessos={acessos}
              isStaff={isStaff}
              isAuthenticated={isAuthenticated}
            />
          )}
        </>
      )}
    </div>
  );
}

function CategoriaSection({
  categoria, albuns, planos, acessos, isStaff, isAuthenticated,
}: {
  categoria: Categoria;
  albuns: Album[];
  planos: Plano[];
  acessos: string[];
  isStaff: boolean;
  isAuthenticated: boolean;
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
            planos={planos}
            temAcesso={isStaff || acessos.includes(album.id)}
            isStaff={isStaff}
            isAuthenticated={isAuthenticated}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function AlbumCard({
  album, categoria, planos, temAcesso, isStaff, isAuthenticated, index,
}: {
  album: Album;
  categoria: Categoria;
  planos: Plano[];
  temAcesso: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
  index: number;
}) {
  const Icon = getTurmaIcon(categoria.icone);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const plano = planos.find((p) => p.album_ids.includes(album.id));

  const handleComprar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!plano) {
      toast({ title: "Plano não encontrado", description: "Entre em contato com o suporte.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("create-turma-checkout", {
        body: { priceId: plano.price_id_stripe },
      });
      if (res.error) throw new Error(res.error.message);
      if ((res.data as any)?.url) window.location.href = (res.data as any).url;
    } catch (err: any) {
      toast({ title: "Erro ao iniciar compra", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

      {!album.is_active && isStaff && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive">Inativo</Badge>
        </div>
      )}

      {!temAcesso && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 p-4 text-center">
          <Lock className="h-8 w-8 text-yellow-400" />
          {plano ? (
            <>
              <div className="text-yellow-400 font-bold text-2xl tracking-tight">
                R$ {plano.valor.toFixed(2).replace(".", ",")}
              </div>
              <div className="text-white/80 text-xs">
                Inclui {plano.meses_banco_geral} {plano.meses_banco_geral === 1 ? "mês" : "meses"} de banco geral
              </div>
            </>
          ) : (
            <span className="text-yellow-400 font-bold tracking-wider text-sm">EM BREVE</span>
          )}
          {plano && (
            <Button
              onClick={handleComprar}
              disabled={loading}
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Adquirir Turma
                </>
              )}
            </Button>
          )}
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
        {temAcesso && !isStaff && (
          <Badge className="mt-2 bg-green-500/90 text-black border-0 font-semibold">
            ✓ Acesso ativo
          </Badge>
        )}
      </div>
    </motion.div>
  );

  if (temAcesso) {
    return (
      <Link to={`/turmas/${album.id}`} className="block">
        {cardInner}
      </Link>
    );
  }

  return <div className="block">{cardInner}</div>;
}
