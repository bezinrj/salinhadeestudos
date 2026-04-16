import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Lock, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Schedule = {
  id: string;
  title: string;
  career: string | null;
  cover_image_url: string | null;
  access_type: string;
  status: string;
  sort_order: number;
};

export default function Schedules() {
  const { isAdmin } = useIsAdmin();
  const { isModerator } = useIsModerator();
  const { subscribed } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdminOrMod = isAdmin || isModerator;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCareer, setFormCareer] = useState("");
  const [formCoverUrl, setFormCoverUrl] = useState("");
  const [formAccessType, setFormAccessType] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules-listing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("id, title, career, cover_image_url, access_type, status, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const visible = isAdminOrMod ? schedules : schedules.filter(s => s.status === "published");

  const grouped = visible.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = s.career || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const careerOrder = ["Delegado", "Ministério Público", "Magistratura Estadual", "Defensoria", "Procuradoria"];
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const ia = careerOrder.indexOf(a);
    const ib = careerOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const handleClick = (s: Schedule) => {
    const isPremium = s.access_type === "premium";
    if (isPremium && !subscribed && !isAdminOrMod) {
      navigate("/meu-plano");
      return;
    }
    navigate(`/cronograma/${s.id}`);
  };

  const resetForm = () => {
    setFormTitle(""); setFormCareer(""); setFormCoverUrl(""); setFormAccessType(false); setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formTitle,
        career: formCareer || null,
        cover_image_url: formCoverUrl || null,
        access_type: formAccessType ? "premium" : "free",
        status: "published" as const,
      };
      if (editingId) {
        const { error } = await supabase.from("schedules").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const maxOrder = schedules.reduce((max, s) => Math.max(max, s.sort_order), -1);
        const { error } = await supabase.from("schedules").insert({ ...payload, sort_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules-listing"] });
      setShowForm(false);
      resetForm();
      toast.success(editingId ? "Cronograma atualizado!" : "Cronograma criado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules-listing"] });
      toast.success("Cronograma excluído!");
    },
  });

  const openEdit = (s: Schedule) => {
    setEditingId(s.id);
    setFormTitle(s.title);
    setFormCareer(s.career || "");
    setFormCoverUrl(s.cover_image_url || "");
    setFormAccessType(s.access_type === "premium");
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Cronogramas</h1>
          <p className="text-sm text-muted-foreground">Sua biblioteca de planos de estudo</p>
        </div>
        {isAdminOrMod && (
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Novo Cronograma
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando cronogramas...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum cronograma disponível</p>
        </div>
      ) : (
        sortedKeys.map(cat => (
          <CareerRow
            key={cat}
            category={cat}
            items={grouped[cat]}
            subscribed={subscribed}
            isAdminOrMod={isAdminOrMod}
            onClick={handleClick}
            onEdit={openEdit}
            onDelete={(id) => { if (confirm("Excluir este cronograma?")) deleteMutation.mutate(id); }}
          />
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cronograma" : "Novo Cronograma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Delegado de Polícia Civil - DF" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Carreira / Categoria</label>
              <Input value={formCareer} onChange={e => setFormCareer(e.target.value)} placeholder="Ex: Delegado" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imagem de capa</label>
              <p className="text-[10px] text-muted-foreground/70 mb-2">Tamanho ideal: <strong>540 × 720 px</strong> (proporção 3:4, JPG ou PNG)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Imagem muito grande (máx 5MB)");
                    return;
                  }
                  setUploading(true);
                  const ext = file.name.split(".").pop() || "jpg";
                  const path = `covers/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("schedule-covers").upload(path, file, { upsert: true });
                  if (error) {
                    toast.error("Erro ao enviar imagem");
                    setUploading(false);
                    return;
                  }
                  const { data: urlData } = supabase.storage.from("schedule-covers").getPublicUrl(path);
                  setFormCoverUrl(urlData.publicUrl);
                  setUploading(false);
                  toast.success("Imagem enviada!");
                }}
              />
              {formCoverUrl ? (
                <div className="relative">
                  <img src={formCoverUrl} alt="Preview" className="w-full h-36 object-cover rounded-lg border border-border/50" />
                  <button
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/20"
                    onClick={() => setFormCoverUrl("")}
                  >
                    <X className="h-3 w-3 text-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full h-28 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="text-xs text-muted-foreground">Enviando...</span>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Clique para enviar imagem</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formAccessType} onCheckedChange={setFormAccessType} />
              <span className="text-xs text-foreground/80">Premium</span>
            </div>
            <Button className="w-full" disabled={!formTitle.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CareerRow({ category, items, subscribed, isAdminOrMod, onClick, onEdit, onDelete }: {
  category: string;
  items: Schedule[];
  subscribed: boolean;
  isAdminOrMod: boolean;
  onClick: (s: Schedule) => void;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-semibold text-foreground">{category}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((s, i) => {
          const isPremium = s.access_type === "premium";
          const locked = isPremium && !subscribed && !isAdminOrMod;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex-shrink-0 w-[160px] md:w-[180px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className="group relative cursor-pointer rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                onClick={() => onClick(s)}
              >
                <div className="relative aspect-[3/4] bg-muted/50 overflow-hidden">
                  {s.cover_image_url ? (
                    <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {isPremium ? (
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 border-0 font-semibold">Premium</Badge>
                  ) : (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-border/50 text-foreground">Gratuito</Badge>
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="h-6 w-6 text-accent" />
                        <span className="text-[10px] text-accent font-semibold">PREMIUM</span>
                      </div>
                    </div>
                  )}
                  {/* Admin edit/delete overlay */}
                  {isAdminOrMod && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background"
                        onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                      >
                        <Pencil className="h-3 w-3 text-foreground" />
                      </button>
                      <button
                        className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/20"
                        onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
