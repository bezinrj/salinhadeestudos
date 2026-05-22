import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Image, X, Loader2, Eye, PenLine, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnswerFileUploadProps {
  userId: string;
  questionId: string;
  onTranscriptionComplete: (text: string) => void;
  onDirectCorrection: (imageBase64: string, mimeType: string) => void;
  onFileSelected?: (fileName: string | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 10;

export function AnswerFileUpload({
  userId,
  questionId,
  onTranscriptionComplete,
  onDirectCorrection,
  onFileSelected,
  disabled,
}: AnswerFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast({ title: "Formato inválido", description: "Envie JPG, PNG, WEBP ou PDF.", variant: "destructive" });
      return;
    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: `Máximo ${MAX_SIZE_MB}MB.`, variant: "destructive" });
      return;
    }

    setFile(selected);
    onFileSelected?.(selected.name);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const uploadToStorage = async (): Promise<string | null> => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${questionId}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("answer-uploads").upload(path, file);
      if (error) {
        console.error("Upload error:", error);
        return null;
      }
      const { data: urlData } = supabase.storage.from("answer-uploads").getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setIsTranscribing(true);

    try {
      const base64 = await fileToBase64(file);

      // For PDFs, we need to handle differently - convert first page
      const { data, error } = await supabase.functions.invoke("transcribe-answer", {
        body: { imageBase64: base64, mimeType: file.type, questionId },
      });

      if (error || data?.error) {
        toast({ title: "Erro na transcrição", description: data?.error || "Tente novamente.", variant: "destructive" });
        return;
      }

      if (data?.transcription) {
        onTranscriptionComplete(data.transcription);
        toast({ title: "Transcrição concluída!", description: "O texto foi inserido na caixa de resposta. Revise antes de enviar." });
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast({ title: "Erro na transcrição", description: "Não foi possível transcrever. Tente novamente.", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDirectCorrection = async () => {
    if (!file) return;
    try {
      // Upload file to storage first
      await uploadToStorage();
      const base64 = await fileToBase64(file);
      onDirectCorrection(base64, file.type);
    } catch (err) {
      console.error("Direct correction prep error:", err);
      toast({ title: "Erro ao processar arquivo", variant: "destructive" });
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    onFileSelected?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {!file ? (
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full border-dashed border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 h-auto py-4 flex flex-col gap-2 transition-all"
        >
          <Upload className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Enviar resposta por imagem ou PDF</span>
          <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP ou PDF • Máx {MAX_SIZE_MB}MB</span>
        </Button>
      ) : (
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            {/* File preview */}
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                {preview && isImage ? (
                  <img
                    src={preview}
                    alt="Preview da resposta"
                    className="w-20 h-28 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-20 h-28 rounded-lg border border-border bg-secondary/50 flex items-center justify-center">
                    {isPdf ? <FileText className="h-8 w-8 text-red-400" /> : <Image className="h-8 w-8 text-primary" />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB • {isImage ? "Imagem" : "PDF"}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFile} className="text-xs text-muted-foreground mt-1 h-7 px-2 hover:text-destructive">
                  <X className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleTranscribe}
                disabled={isTranscribing || disabled}
                className="h-auto py-3 flex flex-col gap-1 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5"
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <PenLine className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-xs font-medium">
                  {isTranscribing ? "Transcrevendo..." : "Transcrever"}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  Extrai o texto para revisão
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleDirectCorrection}
                disabled={isTranscribing || isUploading || disabled}
                className="h-auto py-3 flex flex-col gap-1 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
              >
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Corrigir diretamente</span>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  Correção direto da imagem
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
