import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const CAREERS = [
  "Delegado",
  "Ministério Público",
  "Magistratura Estadual",
  "Defensoria",
  "Procuradoria",
];

type ScheduleData = {
  id: string;
  title: string;
  career: string | null;
  access_type: string;
  cover_image_url: string | null;
  status: string;
  sort_order: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: ScheduleData | null;
}

export default function ScheduleFormDialog({ open, onOpenChange, editData }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editData?.title || "");
  const [career, setCareer] = useState(editData?.career || "");
  const [accessType, setAccessType] = useState(editData?.access_type || "free");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(editData?.cover_image_url || "");
  const [uploading, setUploading] = useState(false);

  // Reset form when dialog opens with new data
  const handleOpenChange = (val: boolean) => {
    if (val && editData) {
      setTitle(editData.title);
      setCareer(editData.career || "");
      setAccessType(editData.access_type);
      setCoverPreview(editData.cover_image_url || "");
      setCoverFile(null);
    } else if (val && !editData) {
      setTitle("");
      setCareer("");
      setAccessType("free");
      setCoverPreview("");
      setCoverFile(null);
    }
    onOpenChange(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return coverPreview || null;
    const ext = coverFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("schedule-covers").upload(path, coverFile);
    if (error) throw error;
    const { data } = supabase.storage.from("schedule-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const coverUrl = await uploadCover();

      if (editData) {
        const { error } = await supabase.from("schedules").update({
          title,
          career,
          access_type: accessType,
          cover_image_url: coverUrl,
        }).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schedules").insert({
          title,
          career,
          access_type: accessType,
          cover_image_url: coverUrl,
          status: "published",
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      handleOpenChange(false);
      toast.success(editData ? "Cronograma atualizado!" : "Cronograma criado!");
    },
    onError: () => toast.error("Erro ao salvar cronograma"),
    onSettled: () => setUploading(false),
  });

  const isValid = title.trim() && career && coverPreview;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Cronograma" : "Novo Cronograma"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Cover Upload */}
          <div>
            <Label className="text-sm mb-2 block">Capa do cronograma *</Label>
            <div
              className="relative w-full aspect-[3/4] max-w-[200px] mx-auto rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverPreview("");
                      setCoverFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">Clique para enviar</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Title */}
          <div>
            <Label className="text-sm mb-1.5 block">Nome do cronograma *</Label>
            <Input placeholder="Ex: Ciclo Delegado PCDF" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Career */}
          <div>
            <Label className="text-sm mb-1.5 block">Cargo/Carreira *</Label>
            <Select value={career} onValueChange={setCareer}>
              <SelectTrigger><SelectValue placeholder="Selecione a carreira" /></SelectTrigger>
              <SelectContent>
                {CAREERS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Type */}
          <div>
            <Label className="text-sm mb-1.5 block">Tipo de acesso *</Label>
            <Select value={accessType} onValueChange={setAccessType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || uploading || saveMutation.isPending}
            className="w-full"
          >
            {uploading || saveMutation.isPending ? "Salvando..." : editData ? "Salvar Alterações" : "Criar Cronograma"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}