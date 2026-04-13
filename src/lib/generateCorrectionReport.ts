import jsPDF from "jspdf";
import type { CorrectionResult } from "@/data/mockData";
import logoImg from "@/assets/logo-report.png";

interface ReportQuestion {
  publicId: number;
  title: string;
  career: string;
  discipline: string;
  subject: string | null;
  statement: string;
}

interface ReportData {
  question: ReportQuestion;
  correction: CorrectionResult;
  submissionType: "texto_manual" | "transcricao" | "correcao_direta";
  answerText: string;
  uploadedFileName?: string | null;
  userName?: string;
}

// Colors
const PRIMARY: [number, number, number] = [37, 99, 235];
const DARK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [241, 245, 249];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const YELLOW: [number, number, number] = [161, 98, 7];
const ORANGE: [number, number, number] = [234, 88, 12];
const WHITE: [number, number, number] = [255, 255, 255];
const GOLD: [number, number, number] = [180, 140, 50];
const SECTION_BG: [number, number, number] = [248, 250, 252];

function getSubmissionLabel(type: string): string {
  if (type === "transcricao") return "Resposta transcrita de imagem/PDF";
  if (type === "correcao_direta") return "Resposta enviada por imagem/PDF (correcao direta)";
  return "Resposta digitada manualmente";
}

function getStatusLabel(status: "full" | "partial" | "missed"): string {
  if (status === "full") return "Atendido";
  if (status === "partial") return "Parcial";
  return "Nao atendido";
}

function getStatusColor(status: "full" | "partial" | "missed"): [number, number, number] {
  if (status === "full") return GREEN;
  if (status === "partial") return YELLOW;
  return RED;
}

function sanitize(text: string): string {
  if (!text) return "";
  // Replace problematic unicode chars with safe alternatives
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

export async function generateCorrectionReport(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 0;
  const lineH = 4.2;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 22) {
      doc.addPage();
      y = 18;
    }
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("Salinha de Estudos", marginL, pageH - 9);
    doc.text("Relatorio de Correcao Discursiva", marginL, pageH - 5.5);
    doc.text(`Pagina ${pageNum} de ${totalPages}`, pageW - marginR, pageH - 9, { align: "right" });
  };

  const sectionTitle = (num: string, title: string) => {
    checkPage(14);
    // Draw accent bar
    doc.setFillColor(...PRIMARY);
    doc.rect(marginL, y, 3, 8, "F");
    // Draw section background
    doc.setFillColor(...LIGHT_BG);
    doc.rect(marginL + 3, y, contentW - 3, 8, "F");
    // Section text
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(`${num}. ${sanitize(title)}`, marginL + 7, y + 5.5);
    y += 12;
  };

  const labelValue = (label: string, value: string, labelW = 28) => {
    checkPage(8);
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(sanitize(label), marginL + 4, y);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(sanitize(value || "---"), contentW - labelW - 6);
    doc.text(lines, marginL + labelW, y);
    y += Math.max(5, lines.length * lineH) + 1.5;
  };

  const wrappedText = (text: string, fontSize = 9, color = DARK, indent = 4) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", "normal");
    const cleaned = sanitize(text);
    // Split into paragraphs first for better readability
    const paragraphs = cleaned.split(/\n\s*\n|\n/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      const lines = doc.splitTextToSize(para.trim(), contentW - indent * 2);
      for (let i = 0; i < lines.length; i++) {
        checkPage(5);
        doc.text(lines[i], marginL + indent, y);
        y += lineH;
      }
      y += 2; // paragraph spacing
    }
  };

  const bulletItem = (text: string, bulletLabel: string, bulletColor: [number, number, number]) => {
    checkPage(8);
    // Draw badge-style label
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const badgeW = doc.getTextWidth(bulletLabel) + 4;
    doc.setFillColor(...bulletColor);
    doc.roundedRect(marginL + 4, y - 3, badgeW, 4.5, 1, 1, "F");
    doc.setTextColor(...WHITE);
    doc.text(bulletLabel, marginL + 6, y);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const textLines = doc.splitTextToSize(sanitize(text), contentW - badgeW - 12);
    doc.text(textLines, marginL + badgeW + 8, y);
    y += Math.max(5, textLines.length * lineH) + 2;
  };

  // ===== HEADER =====
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoImg;
    });
    doc.addImage(img, "PNG", marginL, 8, 20, 20);
  } catch {
    // Skip logo if loading fails
  }

  // Platform name & title
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Salinha de Estudos", marginL + 24, 16);

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.text("Relatorio de Correcao Discursiva", marginL + 24, 22);

  // Date
  const now = new Date();
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const dateStr = `Gerado em ${now.toLocaleDateString("pt-BR")} as ${now.toLocaleTimeString("pt-BR")}`;
  doc.text(dateStr, marginL + 24, 27);

  // Grade box on the right
  const grade = data.correction.grade;
  const gradeColor = grade >= 8 ? GREEN : grade >= 6 ? PRIMARY : grade >= 4 ? YELLOW : RED;
  const boxW = 38;
  const boxX = pageW - marginR - boxW;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(boxX, 8, boxW, 22, 2, 2, "F");
  doc.setDrawColor(...gradeColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, 8, boxW, 22, 2, 2, "S");

  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA FINAL", boxX + boxW / 2, 14, { align: "center" });

  doc.setFontSize(20);
  doc.setTextColor(...gradeColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${grade.toFixed(1)}`, boxX + boxW / 2 - 5, 24);

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`/ ${data.correction.maxGrade}`, boxX + boxW / 2 + 9, 24);

  // Separator
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(marginL, 33, pageW - marginR, 33);
  y = 38;

  // ===== SECTION 1 - IDENTIFICATION =====
  sectionTitle("1", "Identificacao da Questao");
  labelValue("ID:", `Q-${String(data.question.publicId).padStart(3, "0")}`);
  labelValue("Cargo:", data.question.career);
  labelValue("Materia:", data.question.discipline);
  if (data.question.subject) labelValue("Assunto:", data.question.subject);
  y += 2;

  // ===== SECTION 2 - STATEMENT =====
  sectionTitle("2", "Enunciado");
  wrappedText(data.question.statement);

  // ===== SECTION 3 - STUDENT ANSWER =====
  sectionTitle("3", "Resposta do Aluno");
  labelValue("Tipo de envio:", getSubmissionLabel(data.submissionType));
  if (data.uploadedFileName) {
    labelValue("Arquivo:", data.uploadedFileName);
  }
  y += 1;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("Conteudo considerado na correcao:", marginL + 4, y);
  y += 5;

  // Answer box
  const answerText = sanitize(data.answerText || "---");
  const answerLines = doc.splitTextToSize(answerText, contentW - 10);
  const answerH = Math.max(12, answerLines.length * lineH + 8);
  checkPage(answerH + 4);
  doc.setFillColor(...SECTION_BG);
  doc.roundedRect(marginL + 2, y, contentW - 4, answerH, 1.5, 1.5, "F");
  doc.setDrawColor(210, 218, 226);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginL + 2, y, contentW - 4, answerH, 1.5, 1.5, "S");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < answerLines.length; i++) {
    if (y + 5 + i * lineH > pageH - 22) {
      doc.addPage();
      y = 18;
      // Redraw box continuation on new page
    }
    doc.text(answerLines[i], marginL + 6, y + 5 + i * lineH);
  }
  y += answerH + 6;

  // ===== SECTION 4 - GENERAL FEEDBACK =====
  sectionTitle("4", "Feedback Geral");
  wrappedText(data.correction.feedback);

  // ===== SECTION 5 - DETAILED ANALYSIS =====
  if (data.correction.baremaBreakdown && data.correction.baremaBreakdown.length > 0) {
    sectionTitle("5", "Analise Detalhada por Criterio");

    for (const item of data.correction.baremaBreakdown) {
      checkPage(18);

      // Criterion header bar
      doc.setFillColor(235, 240, 248);
      doc.roundedRect(marginL + 2, y, contentW - 4, 8, 1, 1, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(sanitize(`${item.letter}) ${item.title}`), marginL + 6, y + 5.5);

      const ratio = item.earnedScore / item.maxScore;
      const scoreColor = ratio >= 0.8 ? GREEN : ratio >= 0.5 ? YELLOW : RED;
      doc.setTextColor(...scoreColor);
      doc.text(`${item.earnedScore.toFixed(1)} / ${item.maxScore.toFixed(1)}`, pageW - marginR - 6, y + 5.5, { align: "right" });
      y += 11;

      // Progress bar
      checkPage(5);
      const barW = contentW - 12;
      const pct = Math.min(1, ratio);
      doc.setFillColor(220, 225, 235);
      doc.roundedRect(marginL + 6, y, barW, 2.5, 1, 1, "F");
      if (pct > 0) {
        doc.setFillColor(...scoreColor);
        doc.roundedRect(marginL + 6, y, barW * pct, 2.5, 1, 1, "F");
      }
      y += 6;

      // Subitems with badge-style status
      for (const sub of item.subitems) {
        checkPage(10);
        const statusLabel = getStatusLabel(sub.status);
        const statusColor = getStatusColor(sub.status);

        // Status badge
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        const badgeW = doc.getTextWidth(statusLabel) + 5;
        doc.setFillColor(...statusColor);
        doc.roundedRect(marginL + 8, y - 2.8, badgeW, 4, 1, 1, "F");
        doc.setTextColor(...WHITE);
        doc.text(statusLabel, marginL + 10.5, y);

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        const descLines = doc.splitTextToSize(sanitize(sub.description), contentW - badgeW - 30);
        doc.text(descLines, marginL + badgeW + 12, y);

        // Score
        doc.setTextColor(...statusColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(`${sub.earnedScore.toFixed(1)}/${sub.maxScore.toFixed(1)}`, pageW - marginR - 6, y, { align: "right" });

        y += Math.max(5.5, descLines.length * lineH) + 2;
      }
      y += 4;
    }
  }

  // ===== SECTION 6 - POSITIVES =====
  if (data.correction.positives.length > 0 && data.correction.positives[0] !== "Nenhum ponto do espelho foi adequadamente abordado.") {
    sectionTitle("6", "Pontos Positivos");
    for (const p of data.correction.positives) {
      bulletItem(p, "Acerto", GREEN);
    }
    y += 2;
  }

  // ===== SECTION 7 - ERRORS =====
  if (data.correction.errors.length > 0) {
    sectionTitle("7", "Erros / Abordagem Incompleta");
    for (const e of data.correction.errors) {
      bulletItem(e, "Erro", RED);
    }
    y += 2;
  }

  // ===== SECTION 8 - OMISSIONS =====
  if (data.correction.omissions.length > 0) {
    sectionTitle("8", "Omissoes");
    for (const o of data.correction.omissions) {
      bulletItem(o, "Nao abordado", ORANGE);
    }
    y += 2;
  }

  // ===== SECTION 9 - MIRROR =====
  sectionTitle("9", "Espelho Resumido");
  wrappedText(data.correction.mirror);

  // ===== SECTION 10 - IDEAL ANSWER =====
  sectionTitle("10", "Resposta Ideal");
  wrappedText(data.correction.idealAnswer);

  // ===== SECTION 11 - HANDWRITING =====
  if (data.correction.handwritingNote) {
    sectionTitle("11", "Observacao sobre Legibilidade");

    if (data.correction.handwritingLevel) {
      const levelLabels: Record<string, { text: string; color: [number, number, number] }> = {
        plenamente_legivel: { text: "Plenamente legivel", color: GREEN },
        legivel_com_esforco: { text: "Legivel com esforco", color: YELLOW },
        prejudica_parcialmente: { text: "Prejudica parcialmente", color: ORANGE },
        compromete_correcao: { text: "Compromete a correcao", color: RED },
      };
      const level = levelLabels[data.correction.handwritingLevel];
      if (level) {
        checkPage(8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...MUTED);
        doc.text("Legibilidade:", marginL + 4, y);
        // Badge
        const badgeW = doc.getTextWidth(level.text) + 6;
        doc.setFillColor(...level.color);
        doc.roundedRect(marginL + 28, y - 3, badgeW, 4.5, 1, 1, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(7);
        doc.text(level.text, marginL + 31, y);
        y += 7;
      }
    }

    wrappedText(data.correction.handwritingNote);
  }

  // Draw footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Download
  const qCode = `Q-${String(data.question.publicId).padStart(3, "0")}`;
  const dStr = now.toISOString().slice(0, 10);
  doc.save(`relatorio-correcao-${qCode}-${dStr}.pdf`);
}
