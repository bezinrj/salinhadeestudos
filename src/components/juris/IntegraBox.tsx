import { FileText } from "lucide-react";

interface IntegraBoxProps {
  texto?: string;
  refText?: string;
}

export function IntegraBox({ texto, refText }: IntegraBoxProps) {
  if (!texto && !refText) return null;
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
        <FileText className="h-4 w-4" />
        Julgado na íntegra
      </div>
      {texto && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{texto}</p>
      )}
      {refText && (
        <p className="mt-3 border-t border-gold/20 pt-3 text-xs italic text-muted-foreground">
          {refText}
        </p>
      )}
    </div>
  );
}
