import { useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Palette,
  Eraser,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const TEXT_COLORS = [
  { label: "Padrão", value: "#e5e7eb" },
  { label: "Dourado", value: "#facc15" },
  { label: "Âmbar", value: "#fb923c" },
  { label: "Verde", value: "#4ade80" },
  { label: "Azul", value: "#60a5fa" },
  { label: "Rosa", value: "#f472b6" },
  { label: "Vermelho", value: "#f87171" },
];

const HIGHLIGHTS = [
  { label: "Amarelo", value: "#facc1566" },
  { label: "Verde", value: "#4ade8055" },
  { label: "Azul", value: "#60a5fa55" },
  { label: "Rosa", value: "#f472b655" },
];

export function NoteEditor({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Inicializa/sincroniza apenas quando o conteúdo externo difere do DOM
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback(
    (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      ref.current?.focus();
      onChange(ref.current?.innerHTML ?? "");
    },
    [onChange],
  );

  const toolBtn =
    "p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-secondary", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/80 p-1.5">
        {[
          { icon: Bold, cmd: "bold", label: "Negrito" },
          { icon: Italic, cmd: "italic", label: "Itálico" },
          { icon: Underline, cmd: "underline", label: "Sublinhado" },
          { icon: Strikethrough, cmd: "strikeThrough", label: "Tachado" },
        ].map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(t.cmd);
            }}
            className={toolBtn}
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Cor do texto" className={toolBtn} onMouseDown={(e) => e.preventDefault()}>
              <Palette className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec("foreColor", c.value);
                  }}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Marca-texto" className={toolBtn} onMouseDown={(e) => e.preventDefault()}>
              <Highlighter className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1.5">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec("hiliteColor", c.value);
                  }}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          title="Lista com bolinhas"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          className={toolBtn}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Lista numerada"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
          className={toolBtn}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Limpar formatação"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("removeFormat");
          }}
          className={toolBtn}
        >
          <Eraser className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className={cn(
          "min-h-[80px] px-3 py-2 text-sm text-foreground outline-none",
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1",
          "empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}

export function isNoteEmpty(html: string) {
  return !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
}
