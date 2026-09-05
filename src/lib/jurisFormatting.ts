export interface JurisStructuredLine {
  title: string;
  description: string;
}

const LEADING_MARKER = /^\s*(?:(?:[-*•]+|\d+[.)])\s*)+/;
const MARKDOWN_TITLE = /^\*\*(.+?)\*\*\s*(?::|—|–|-)?\s*(.*)$/;

function cleanTitle(value: string): string {
  return value
    .replace(LEADING_MARKER, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
}

function cleanDescription(value: string): string {
  return value.replace(/^\s*(?::|—|–|-)\s*/, "").replace(/\*\*/g, "").trim();
}

export function parseJurisStructuredLine(line: string): JurisStructuredLine {
  const normalized = line.trim().replace(LEADING_MARKER, "");
  const markdownMatch = normalized.match(MARKDOWN_TITLE);

  if (markdownMatch) {
    return {
      title: cleanTitle(markdownMatch[1]),
      description: cleanDescription(markdownMatch[2]),
    };
  }

  const separator = normalized.match(/\s+(—|–)\s+/);
  if (separator?.index !== undefined) {
    const descriptionStart = separator.index + separator[0].length;
    return {
      title: cleanTitle(normalized.slice(0, separator.index)),
      description: cleanDescription(normalized.slice(descriptionStart)),
    };
  }

  return {
    title: cleanTitle(normalized.replace(/\*\*/g, "")),
    description: "",
  };
}