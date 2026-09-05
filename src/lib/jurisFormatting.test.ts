import { describe, expect, it } from "vitest";
import { parseJurisStructuredLine, parseJurisStructuredText } from "./jurisFormatting";

describe("parseJurisStructuredLine", () => {
  it("formats an AI-generated Markdown title followed by a colon", () => {
    expect(parseJurisStructuredLine("**1. Princípio do Pacto Federativo (Art. 1º, caput, CF/88)**: A exigência preserva a autonomia.")).toEqual({
      title: "Princípio do Pacto Federativo (Art. 1º, caput, CF/88)",
      description: "A exigência preserva a autonomia.",
    });
  });

  it("preserves the existing plain-text dash format", () => {
    expect(parseJurisStructuredLine("Princípio Federativo — Garante a autonomia dos entes federados.")).toEqual({
      title: "Princípio Federativo",
      description: "Garante a autonomia dos entes federados.",
    });
  });

  it("removes bullets without changing punctuation inside the title", () => {
    expect(parseJurisStructuredLine("* **ICMS (Imposto sobre Operações)**: Imposto de competência estadual.")).toEqual({
      title: "ICMS (Imposto sobre Operações)",
      description: "Imposto de competência estadual.",
    });
  });
});

describe("parseJurisStructuredText", () => {
  it("formats the conceptual content generated for an existing ruling", () => {
    const content = [
      "**ICMS (Imposto sobre Operações)**: Imposto de competência estadual.",
      "**Seletividade do ICMS**: Princípio constitucional que modula as alíquotas.",
    ].join("\n\n");

    expect(parseJurisStructuredText(content)).toEqual([
      {
        title: "ICMS (Imposto sobre Operações)",
        description: "Imposto de competência estadual.",
      },
      {
        title: "Seletividade do ICMS",
        description: "Princípio constitucional que modula as alíquotas.",
      },
    ]);
  });

  it("preserves ordinary conceptual prose instead of treating it as titles", () => {
    expect(parseJurisStructuredText("O tribunal analisou o regime jurídico aplicável.\nA decisão preservou a segurança jurídica.")).toBeNull();
  });
});