import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Strikethrough, Highlighter, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (html: string) => void;
  isPending?: boolean;
}

export function RichTextEditor({ onSubmit, isPending }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 2MB)", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("comment-images").upload(path, file);
    if (error) {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("comment-images").getPublicUrl(path);
    exec("insertImage", urlData.publicUrl);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    const html = editorRef.current?.innerHTML?.trim() || "";
    if (!html || html === "<br>") return;
    onSubmit(html);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const tools = [
    { icon: Bold, cmd: "bold", label: "Negrito" },
    { icon: Italic, cmd: "italic", label: "Itálico" },
    { icon: Underline, cmd: "underline", label: "Sublinhado" },
    { icon: Strikethrough, cmd: "strikeThrough", label: "Tachado" },
    { icon: Highlighter, cmd: "hiliteColor", value: "#facc15", label: "Marca-texto" },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-secondary/80 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(t.cmd, t.value);
            }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <button
          type="button"
          title="Imagem"
          onClick={() => fileRef.current?.click()}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending}
          className="gradient-electric text-white text-xs h-7 px-3"
        >
          Enviar
        </Button>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[60px] max-h-[200px] overflow-y-auto p-3 text-sm text-foreground",
          "focus:outline-none [&_img]:max-w-[200px] [&_img]:rounded [&_img]:my-1",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        )}
        data-placeholder="Escreva seu comentário..."
      />
    </div>
  );
}
