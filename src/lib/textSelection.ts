// Utilitários de seleção de texto para os grifos do Vade Mecum.

// Caracteres considerados parte de uma "palavra" (inclui acentos e hífen).
const WORD_RE = /[\p{L}\p{N}ºª§°_-]/u;

const isWordChar = (ch: string | undefined) => !!ch && WORD_RE.test(ch);

/**
 * Expande a seleção até as bordas da palavra e apara espaços/pontuação nas pontas.
 * Retorna offsets normalizados dentro de `text`.
 */
export function snapToWordBoundaries(text: string, startIn: number, endIn: number) {
  let start = Math.max(0, Math.min(startIn, text.length));
  let end = Math.max(0, Math.min(endIn, text.length));
  if (end < start) [start, end] = [end, start];

  // Apara espaços nas pontas antes de expandir
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;

  if (start === end) return { start, end };

  // Expande para trás enquanto estivermos no meio de uma palavra
  while (start > 0 && isWordChar(text[start - 1]) && isWordChar(text[start])) start--;
  // Expande para frente
  while (end < text.length && isWordChar(text[end]) && isWordChar(text[end - 1])) end++;

  // Apara pontuação isolada nas pontas (mantém a palavra limpa)
  while (end > start && /[\s.,;:]/.test(text[end - 1])) end--;
  while (start < end && /[\s.,;:]/.test(text[start])) start++;

  return { start, end };
}
