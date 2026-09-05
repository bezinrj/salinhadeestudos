import { describe, expect, it } from "vitest";
import { parseJurisStructuredLine } from "./jurisFormatting";

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