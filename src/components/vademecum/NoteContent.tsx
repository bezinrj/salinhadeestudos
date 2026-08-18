import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "s", "strike", "span", "ul", "ol", "li", "br", "p", "div"];

export function noteHasHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export function NoteContent({ content, className }: Props) {
  const base = cn(
    "text-sm text-foreground/90 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1",
    className,
  );

  if (!noteHasHtml(content)) {
    return <p className={cn(base, "whitespace-pre-wrap")}>{content}</p>;
  }

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["style"],
    FORBID_ATTR: ["onerror", "onclick", "onload"],
  });

  return <div className={base} dangerouslySetInnerHTML={{ __html: clean }} />;
}
