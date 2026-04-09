import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Paperclip, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const PROBLEM_TYPES = [
  { value: "gabarito_errado", label: "Gabarito possivelmente errado" },
  { value: "correcao_inconsistente", label: "Correção inconsistente" },
  { value: "problema_enunciado", label: "Problema no enunciado" },
  { value: "materia_errada", label: "Matéria/categoria errada" },
  { value: "barema_incoerente", label: "Barema incoerente" },
  { value: "erro_digitacao", label: "Erro de digitação ou formatação" },
  { value: "outro", label: "Outro" },
] as const;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface Props {
  questionId: string;
  questionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportQuestionDialog({ questionId, questionTitle, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setProblemType("");
    setDescription("");
    setFile(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 2 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user || !problemType || description.trim().length < 10) return;
    setSubmitting(true);

    try {
      // Anti-spam check
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from("question_reports" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .gte("created_at", twentyFourHoursAgo)
        .limit(1);

      if (existing && (existing as any[]).length > 0) {
        toast({ title: "Aguarde", description: "Você já reportou esta questão nas últimas 24 horas.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      let attachmentData: Record<string, any> = {};

      // Upload file if present
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${questionId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("report-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("report-attachments").getPublicUrl(path);

        attachmentData = {
          attachment_url: urlData.publicUrl,
          attachment_path: path,
          attachment_name: file.name,
          attachment_size: file.size,
          attachment_type: file.type,
          attachment_expires_at: null,
          attachment_deleted_at: null,
        };
      }

      const { error } = await (supabase.from("question_reports" as any) as any).insert({
        question_id: questionId,
        user_id: user.id,
        problem_type: problemType,
        description: description.trim(),
        ...attachmentData,
      });

      if (error) throw error;

      toast({ title: "Reclamação enviada", description: "Sua reclamação será analisada pela equipe." });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Reportar problema
          </DialogTitle>
          <DialogDescription className="text-xs truncate">
            Questão: {questionTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tipo do problema *</Label>
            <Select value={problemType} onValueChange={setProblemType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {PROBLEM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Descreva o problema *</Label>
            <Textarea
              placeholder="Explique o erro ou inconsistência encontrada... (mínimo 10 caracteres)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[100px]"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{description.length} caracteres</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Anexo (opcional)</Label>
            <p className="text-[10px] text-muted-foreground mb-1.5">JPG, PNG ou WEBP. Máximo 2 MB.</p>

            {file && preview ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                <img src={preview} alt="Preview" className="w-full max-h-40 object-contain bg-secondary" />
                <button onClick={removeFile} className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-background">
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> Anexar imagem
              </Button>
            )}
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!problemType || description.trim().length < 10 || submitting}
            className="w-full"
          >
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : "Enviar reclamação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
