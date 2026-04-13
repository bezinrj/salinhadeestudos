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
const DARK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [241, 245, 249];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const YELLOW: [number, number, number] = [161, 98, 7];
const WHITE: [number, number, number] = [255, 255, 255];

function getSubmissionLabel(type: string): string {
  if (type === "transcricao") return "Resposta transcrita de imagem/PDF";
  if (type === "correcao_direta") return "Resposta enviada por imagem/PDF (correção direta)";
  return "Resposta digitada manualmente";
}

function getStatusLabel(status: "full" | "partial" | "missed"): string {
  if (status === "full") return "✓";
  if (status === "partial") return "~";
  return "✗";
}

export async function generateCorrectionReport(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 25) {
      doc.addPage();
      y = 20;
      drawFooter();
    }
  };

  const drawFooter = () => {
    const pg = doc.getNumberOfPages();
    doc.setPage(pg);
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 15, pageW - marginR, pageH - 15);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text("Salinha de Estudos — Relatório de Correção Discursiva", marginL, pageH - 10);
    doc.text(`Página ${pg}`, pageW - marginR, pageH - 10, { align: "right" });
  };

  const sectionTitle = (title: string) => {
    checkPage(14);
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(marginL, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.text(title, marginL + 4, y + 5.5);
    y += 12;
  };

  const labelValue = (label: string, value: string) => {
    checkPage(8);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(label, marginL + 2, y);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", contentW - 30);
    doc.text(lines, marginL + 32, y);
    y += Math.max(5, lines.length * 4) + 1;
  };

  const wrappedText = (text: string, fontSize = 9, color = DARK) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text || "—", contentW - 4);
    for (let i = 0; i < lines.length; i++) {
      checkPage(5);
      doc.text(lines[i], marginL + 2, y);
      y += 4;
    }
    y += 2;
  };

  // ===== HEADER =====
  // Load logo
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoImg;
    });
    doc.addImage(img, "PNG", marginL, 10, 18, 18);
  } catch {
    // Skip logo if loading fails
  }

  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Salinha de Estudos", marginL + 22, 18);
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Correção Discursiva", marginL + 22, 24);

  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`, pageW - marginR, 18, { align: "right" });

  // Separator line
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(marginL, 32, pageW - marginR, 32);
  y = 38;

  // ===== GRADE HIGHLIGHT =====
  checkPage(28);
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(marginL, y, contentW, 22, 2, 2, "F");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA FINAL", marginL + contentW / 2, y + 7, { align: "center" });

  const grade = data.correction.grade;
  const gradeColor = grade >= 8 ? GREEN : grade >= 6 ? PRIMARY : grade >= 4 ? YELLOW : RED;
  doc.setFontSize(28);
  doc.setTextColor(...gradeColor);
  doc.text(`${grade.toFixed(1)}`, marginL + contentW / 2 - 8, y + 18);
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(`/ ${data.correction.maxGrade}`, marginL + contentW / 2 + 10, y + 18);
  y += 28;

  // ===== BLOCO 1 - IDENTIFICAÇÃO =====
  sectionTitle("1. Identificação da Questão");
  labelValue("ID:", `Q-${String(data.question.publicId).padStart(3, "0")}`);
  labelValue("Cargo:", data.question.career);
  labelValue("Matéria:", data.question.discipline);
  if (data.question.subject) labelValue("Assunto:", data.question.subject);
  y += 2;

  // ===== BLOCO 2 - ENUNCIADO =====
  sectionTitle("2. Enunciado da Questão");
  wrappedText(data.question.statement);

  // ===== BLOCO 3 - RESPOSTA =====
  sectionTitle("3. Resposta do Aluno");
  labelValue("Tipo de envio:", getSubmissionLabel(data.submissionType));
  if (data.uploadedFileName) {
    labelValue("Arquivo:", data.uploadedFileName);
  }
  y += 2;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("Conteúdo da resposta:", marginL + 2, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  const answerLines = doc.splitTextToSize(data.answerText || "—", contentW - 8);
  const answerH = Math.max(10, answerLines.length * 4 + 6);
  checkPage(answerH + 4);
  doc.roundedRect(marginL, y, contentW, answerH, 1, 1, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginL, y, contentW, answerH, 1, 1, "S");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < answerLines.length; i++) {
    checkPage(5);
    doc.text(answerLines[i], marginL + 4, y + 5 + i * 4);
  }
  y += answerH + 6;

  // ===== BLOCO 4 - RESULTADO =====
  sectionTitle("4. Feedback Geral");
  wrappedText(data.correction.feedback);

  // ===== BLOCO 5 - DETALHAMENTO (BAREMA) =====
  if (data.correction.baremaBreakdown && data.correction.baremaBreakdown.length > 0) {
    sectionTitle("5. Análise Detalhada por Critério");

    for (const item of data.correction.baremaBreakdown) {
      checkPage(14);

      // Item header
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(marginL + 2, y, contentW - 4, 7, 1, 1, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(`${item.letter}) ${item.title}`, marginL + 5, y + 5);

      const scoreColor = (item.earnedScore / item.maxScore) >= 0.8 ? GREEN : (item.earnedScore / item.maxScore) >= 0.5 ? YELLOW : RED;
      doc.setTextColor(...scoreColor);
      doc.text(`${item.earnedScore.toFixed(1)} / ${item.maxScore.toFixed(1)}`, pageW - marginR - 5, y + 5, { align: "right" });
      y += 10;

      // Progress bar
      checkPage(6);
      const barW = contentW - 8;
      const pct = Math.min(1, item.earnedScore / item.maxScore);
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(marginL + 4, y, barW, 2.5, 1, 1, "F");
      if (pct > 0) {
        doc.setFillColor(...scoreColor);
        doc.roundedRect(marginL + 4, y, barW * pct, 2.5, 1, 1, "F");
      }
      y += 5;

      // Subitems
      for (const sub of item.subitems) {
        checkPage(7);
        const statusSymbol = getStatusLabel(sub.status);
        const statusColor = sub.status === "full" ? GREEN : sub.status === "partial" ? YELLOW : RED;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...statusColor);
        doc.text(statusSymbol, marginL + 6, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        const subLines = doc.splitTextToSize(sub.description, contentW - 40);
        doc.text(subLines, marginL + 12, y);

        doc.setTextColor(...statusColor);
        doc.text(`${sub.earnedScore.toFixed(1)}/${sub.maxScore.toFixed(1)}`, pageW - marginR - 5, y, { align: "right" });

        y += Math.max(5, subLines.length * 4) + 1;
      }
      y += 3;
    }
  }

  // ===== ESPELHO RESUMIDO =====
  sectionTitle("6. Espelho Resumido");
  wrappedText(data.correction.mirror);

  // ===== PONTOS POSITIVOS =====
  if (data.correction.positives.length > 0 && data.correction.positives[0] !== "Nenhum ponto do espelho foi adequadamente abordado.") {
    sectionTitle("7. Pontos Positivos");
    for (const p of data.correction.positives) {
      checkPage(7);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GREEN);
      doc.text("✓", marginL + 4, y);
      doc.setTextColor(...DARK);
      const pLines = doc.splitTextToSize(p, contentW - 14);
      doc.text(pLines, marginL + 10, y);
      y += Math.max(5, pLines.length * 4) + 1;
    }
    y += 2;
  }

  // ===== ERROS =====
  if (data.correction.errors.length > 0) {
    sectionTitle("8. Erros / Abordagem Incompleta");
    for (const e of data.correction.errors) {
      checkPage(7);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...RED);
      doc.text("✗", marginL + 4, y);
      doc.setTextColor(...DARK);
      const eLines = doc.splitTextToSize(e, contentW - 14);
      doc.text(eLines, marginL + 10, y);
      y += Math.max(5, eLines.length * 4) + 1;
    }
    y += 2;
  }

  // ===== OMISSÕES =====
  if (data.correction.omissions.length > 0) {
    sectionTitle("9. Omissões");
    for (const o of data.correction.omissions) {
      checkPage(7);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...YELLOW);
      doc.text("⚠", marginL + 4, y);
      doc.setTextColor(...DARK);
      const oLines = doc.splitTextToSize(o, contentW - 14);
      doc.text(oLines, marginL + 10, y);
      y += Math.max(5, oLines.length * 4) + 1;
    }
    y += 2;
  }

  // ===== RESPOSTA IDEAL =====
  sectionTitle("10. Resposta Ideal");
  wrappedText(data.correction.idealAnswer);

  // ===== CALIGRAFIA =====
  if (data.correction.handwritingNote) {
    sectionTitle("11. Observação sobre Legibilidade");
    if (data.correction.handwritingLevel) {
      const levelLabels: Record<string, string> = {
        plenamente_legivel: "✅ Plenamente legível",
        legivel_com_esforco: "⚠️ Legível com esforço",
        prejudica_parcialmente: "🔶 Prejudica parcialmente",
        compromete_correcao: "🔴 Compromete a correção",
      };
      labelValue("Nível:", levelLabels[data.correction.handwritingLevel] || data.correction.handwritingLevel);
    }
    wrappedText(data.correction.handwritingNote);
  }

  // Draw footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter();
  }

  // Download
  const qCode = `Q-${String(data.question.publicId).padStart(3, "0")}`;
  const dateStr = now.toISOString().slice(0, 10);
  doc.save(`relatorio-correcao-${qCode}-${dateStr}.pdf`);
}
