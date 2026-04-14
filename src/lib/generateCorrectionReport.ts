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

// ─── Palette ───
const NAVY: [number, number, number] = [30, 42, 74];
const INDIGO: [number, number, number] = [99, 102, 241];
const BG: [number, number, number] = [248, 249, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const CARD_SHADOW: [number, number, number] = [220, 225, 232];
const AMBER: [number, number, number] = [245, 158, 11];
const GREEN: [number, number, number] = [16, 185, 129];
const RED: [number, number, number] = [239, 68, 68];
const TEXT_PRIMARY: [number, number, number] = [31, 41, 55];
const TEXT_SECONDARY: [number, number, number] = [107, 114, 128];
const LIGHT_BLUE_BG: [number, number, number] = [238, 242, 255];
const AMBER_BG: [number, number, number] = [255, 251, 235];
const GREEN_LIGHT: [number, number, number] = [236, 253, 245];
const RED_LIGHT: [number, number, number] = [254, 242, 242];
const MIRROR_BG: [number, number, number] = [241, 245, 249];
const BAR_TRACK: [number, number, number] = [229, 231, 235];

function sanitize(t: string): string {
  if (!t) return "";
  return t
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

function getSubmissionLabel(type: string): string {
  if (type === "transcricao") return "Resposta transcrita de imagem/PDF";
  if (type === "correcao_direta") return "Resposta enviada por imagem/PDF (correcao direta)";
  return "Resposta digitada manualmente";
}

function getStatusLabel(s: "full" | "partial" | "missed"): string {
  if (s === "full") return "Atendido";
  if (s === "partial") return "Parcial";
  return "Nao atendido";
}

function statusColor(s: "full" | "partial" | "missed"): [number, number, number] {
  if (s === "full") return GREEN;
  if (s === "partial") return AMBER;
  return RED;
}

function statusBg(s: "full" | "partial" | "missed"): [number, number, number] {
  if (s === "full") return GREEN_LIGHT;
  if (s === "partial") return AMBER_BG;
  return RED_LIGHT;
}

export async function generateCorrectionReport(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;
  const cw = pw - ml - mr;
  let y = 0;
  const lh = 4.5;

  const needPage = (n: number) => {
    if (y + n > ph - 18) {
      doc.addPage();
      y = 14;
    }
  };

  // ─── Rounded rect helper ───
  const card = (x: number, yy: number, w: number, h: number, r = 3) => {
    doc.setFillColor(...WHITE);
    doc.roundedRect(x, yy, w, h, r, r, "F");
    // subtle shadow line at bottom
    doc.setDrawColor(...CARD_SHADOW);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, r, r, "S");
  };

  const sectionLabel = (text: string, color: [number, number, number] = TEXT_PRIMARY) => {
    needPage(10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(sanitize(text).toUpperCase(), ml, y);
    y += 5;
  };

  const wrappedInCard = (text: string, padL = 4, fontSize = 9) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_PRIMARY);
    const paragraphs = sanitize(text).split(/\n\s*\n|\n/);
    for (const p of paragraphs) {
      if (!p.trim()) continue;
      const lines = doc.splitTextToSize(p.trim(), cw - padL * 2);
      for (const line of lines) {
        needPage(5);
        doc.text(line, ml + padL, y);
        y += lh;
      }
      y += 1.5;
    }
  };

  // ═══════════════════════════════════════════
  // HEADER – dark navy bar
  // ═══════════════════════════════════════════
  const headerH = 40;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, headerH, "F");

  // Logo — vertically centered in header
  const logoSize = 14;
  const logoY = (headerH - logoSize) / 2;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = logoImg;
    });
    doc.addImage(img, "PNG", ml, logoY, logoSize, logoSize);
  } catch {
    // skip
  }

  // Header text left side — vertically centered with logo
  const textX = ml + logoSize + 4;
  const headerCenterY = headerH / 2;

  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 190, 220);
  doc.text("SALINHA DE ESTUDOS", textX, headerCenterY - 8);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("Relatorio de Correcao Discursiva", textX, headerCenterY);

  const now = new Date();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 170, 200);
  doc.text(`Gerado em ${now.toLocaleDateString("pt-BR")} as ${now.toLocaleTimeString("pt-BR")}`, textX, headerCenterY + 7);

  // Grade circle on the right — perfectly centered
  const grade = data.correction.grade;
  const maxGrade = data.correction.maxGrade;
  const pct = Math.min(1, grade / maxGrade);
  const gradeColor: [number, number, number] = pct >= 0.7 ? GREEN : pct >= 0.4 ? AMBER : RED;

  const cx = pw - mr - 16;
  const cy = headerH / 2;
  const radius = 13;

  // Track circle
  doc.setDrawColor(60, 70, 100);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius, "S");

  // Progress arc
  doc.setDrawColor(...gradeColor);
  doc.setLineWidth(2.5);
  const segments = Math.floor(pct * 36);
  for (let i = 0; i < segments; i++) {
    const angle1 = (i * 10 - 90) * (Math.PI / 180);
    const angle2 = ((i + 1) * 10 - 90) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(angle1);
    const y1 = cy + radius * Math.sin(angle1);
    const x2 = cx + radius * Math.cos(angle2);
    const y2 = cy + radius * Math.sin(angle2);
    doc.line(x1, y1, x2, y2);
  }

  // Grade number — perfectly centered in circle
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const gradeText = grade.toFixed(1);
  // Vertical center: baseline offset ~1/3 of font cap height
  doc.text(gradeText, cx, cy + 1, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(160, 170, 200);
  doc.text(`/ ${maxGrade}`, cx, cy + 6, { align: "center" });

  doc.setFontSize(5.5);
  doc.text("NOTA FINAL", cx, cy + 10.5, { align: "center" });

  y = headerH + 6;

  // ═══════════════════════════════════════════
  // 3 INFO CARDS
  // ═══════════════════════════════════════════
  const cardW = (cw - 6) / 3;
  const cardH = 16;
  const infoItems = [
    { label: "ID DA QUESTAO", value: `Q-${String(data.question.publicId).padStart(3, "0")}` },
    { label: "CARGO", value: data.question.career },
    { label: "MATERIA", value: data.question.discipline },
  ];

  for (let i = 0; i < 3; i++) {
    const cx2 = ml + i * (cardW + 3);
    doc.setFillColor(...LIGHT_BLUE_BG);
    doc.roundedRect(cx2, y, cardW, cardH, 2, 2, "F");

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(infoItems[i].label, cx2 + 4, y + 5.5);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_PRIMARY);
    const val = sanitize(infoItems[i].value);
    const truncated = val.length > 28 ? val.substring(0, 27) + "..." : val;
    doc.text(truncated, cx2 + 4, y + 12);
  }
  y += cardH + 6;

  // ═══════════════════════════════════════════
  // ENUNCIADO
  // ═══════════════════════════════════════════
  const cardPad = 6; // consistent inner padding for all text cards
  const textMaxW = cw - cardPad * 2 - 4; // safe text width inside cards

  sectionLabel("ENUNCIADO DA QUESTAO", INDIGO);
  const stmtText = sanitize(data.question.statement);
  const stmtLines = doc.splitTextToSize(stmtText, textMaxW);
  const stmtH = Math.max(14, stmtLines.length * lh + 12);
  needPage(stmtH + 4);

  card(ml, y, cw, stmtH);
  doc.setFillColor(...INDIGO);
  doc.rect(ml, y, 2.5, stmtH, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_PRIMARY);
  let sy = y + 7;
  for (const line of stmtLines) {
    if (sy > ph - 18) { doc.addPage(); sy = 14; }
    doc.text(line, ml + cardPad + 2, sy);
    sy += lh;
  }
  y += stmtH + 6;

  // ═══════════════════════════════════════════
  // RESPOSTA DO ALUNO
  // ═══════════════════════════════════════════
  sectionLabel("RESPOSTA DO ALUNO");
  const answerMeta = `${getSubmissionLabel(data.submissionType)}${data.uploadedFileName ? ` | Arquivo: ${data.uploadedFileName}` : ""}`;
  const ansText = sanitize(data.answerText || "---");
  const ansLines = doc.splitTextToSize(ansText, textMaxW);
  const ansH = Math.max(14, ansLines.length * lh + 18);
  needPage(Math.min(ansH + 4, 60));

  card(ml, y, cw, ansH);
  doc.setFillColor(...INDIGO);
  doc.rect(ml, y, 2.5, ansH, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(sanitize(answerMeta), ml + cardPad + 2, y + 5.5);

  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_PRIMARY);
  let ay = y + 12;
  for (const line of ansLines) {
    if (ay > ph - 18) { doc.addPage(); ay = 14; }
    doc.text(line, ml + cardPad + 2, ay);
    ay += lh;
  }
  y += ansH + 6;

  // ═══════════════════════════════════════════
  // FEEDBACK GERAL — cream card with lamp emoji
  // ═══════════════════════════════════════════
  const CREAM_BG: [number, number, number] = [255, 250, 240];
  const AMBER_BORDER: [number, number, number] = [233, 185, 73];
  const BROWN_TEXT: [number, number, number] = [154, 90, 34];

  const fbText = sanitize(data.correction.feedback);
  const fbLines = doc.splitTextToSize(fbText, textMaxW);
  const fbTitleH = 8;
  const fbH = Math.max(18, fbLines.length * lh + fbTitleH + 12);
  needPage(Math.min(fbH + 4, 60));

  // Cream background card
  doc.setFillColor(...CREAM_BG);
  doc.roundedRect(ml, y, cw, fbH, 3, 3, "F");
  doc.setDrawColor(...AMBER_BORDER);
  doc.setLineWidth(0.5);
  doc.roundedRect(ml, y, cw, fbH, 3, 3, "S");

  // Title with lamp emoji
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BROWN_TEXT);
  doc.text("FEEDBACK GERAL", ml + cardPad, y + 6.5);

  // Body text in italic brown
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...BROWN_TEXT);
  let fy = y + fbTitleH + 6;
  for (const line of fbLines) {
    if (fy > ph - 18) { doc.addPage(); fy = 14; }
    doc.text(line, ml + cardPad, fy);
    fy += lh;
  }
  y += fbH + 6;

  // ═══════════════════════════════════════════
  // ANALISE POR CRITERIO
  // ═══════════════════════════════════════════
  if (data.correction.baremaBreakdown && data.correction.baremaBreakdown.length > 0) {
    sectionLabel("ANALISE DETALHADA POR CRITERIO", NAVY);

    for (const item of data.correction.baremaBreakdown) {
      const ratio = item.earnedScore / item.maxScore;
      const barColor: [number, number, number] = ratio >= 0.7 ? GREEN : ratio >= 0.4 ? AMBER : RED;

      // Estimate card height
      let itemH = 20; // header + bar
      for (const sub of item.subitems) {
        const dl = doc.splitTextToSize(sanitize(sub.description), cw - 50);
        itemH += Math.max(6, dl.length * lh) + 3;
      }
      itemH += 4;

      needPage(Math.min(itemH, 80));

      const cardY = y;
      card(ml, cardY, cw, itemH);

      // Criterion header
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT_PRIMARY);
      doc.text(sanitize(`${item.letter}) ${item.title}`), ml + 5, cardY + 7);

      // Score
      doc.setTextColor(...barColor);
      doc.text(`${item.earnedScore.toFixed(1)} / ${item.maxScore.toFixed(1)}`, pw - mr - 5, cardY + 7, { align: "right" });

      // Progress bar
      const barY = cardY + 11;
      const barW = cw - 10;
      doc.setFillColor(...BAR_TRACK);
      doc.roundedRect(ml + 5, barY, barW, 2.5, 1, 1, "F");
      if (ratio > 0) {
        doc.setFillColor(...barColor);
        doc.roundedRect(ml + 5, barY, barW * Math.min(1, ratio), 2.5, 1, 1, "F");
      }

      // Sub-items
      let subY = barY + 7;
      for (const sub of item.subitems) {
        const sBg = statusBg(sub.status);
        const sColor = statusColor(sub.status);
        const sLabel = getStatusLabel(sub.status);
        const descLines = doc.splitTextToSize(sanitize(sub.description), cw - 55);
        const rowH = Math.max(6, descLines.length * lh) + 2;

        // Row background
        doc.setFillColor(...sBg);
        doc.roundedRect(ml + 3, subY - 3, cw - 6, rowH, 1, 1, "F");

        // Status badge
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        const badgeW = doc.getTextWidth(sLabel) + 5;
        doc.setFillColor(...sColor);
        doc.roundedRect(ml + 5, subY - 2, badgeW, 4, 1, 1, "F");
        doc.setTextColor(...WHITE);
        doc.text(sLabel, ml + 7.5, subY + 1);

        // Description
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT_PRIMARY);
        doc.text(descLines, ml + badgeW + 9, subY + 1);

        // Score
        doc.setTextColor(...sColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(`${sub.earnedScore.toFixed(1)}/${sub.maxScore.toFixed(1)}`, pw - mr - 5, subY + 1, { align: "right" });

        subY += rowH + 1;
      }

      y = subY + 4;
    }
    y += 2;
  }

  // ═══════════════════════════════════════════
  // PONTOS POSITIVOS / ERROS / OMISSOES - 3 columns
  // ═══════════════════════════════════════════
  const hasPositives = data.correction.positives.length > 0 && data.correction.positives[0] !== "Nenhum ponto do espelho foi adequadamente abordado.";
  const hasErrors = data.correction.errors.length > 0;
  const hasOmissions = data.correction.omissions.length > 0;

  if (hasPositives || hasErrors || hasOmissions) {
    needPage(30);
    sectionLabel("PONTOS POSITIVOS / ERROS / OMISSOES", NAVY);

    const colW = (cw - 6) / 3;
    const cols = [
      { label: "PONTOS POSITIVOS", items: hasPositives ? data.correction.positives : [], color: GREEN, bg: GREEN_LIGHT },
      { label: "ERROS", items: hasErrors ? data.correction.errors : [], color: RED, bg: RED_LIGHT },
      { label: "OMISSOES", items: hasOmissions ? data.correction.omissions : [], color: AMBER, bg: AMBER_BG },
    ];

    // Calculate max height across columns
    let maxH = 16;
    for (const col of cols) {
      let h = 12;
      for (const it of col.items) {
        const lines = doc.splitTextToSize(sanitize(it), colW - 10);
        h += lines.length * lh + 2;
      }
      if (h > maxH) maxH = h;
    }
    maxH = Math.min(maxH, ph - y - 20);
    needPage(maxH + 4);

    for (let i = 0; i < 3; i++) {
      const col = cols[i];
      const colX = ml + i * (colW + 3);

      // Card
      doc.setFillColor(...WHITE);
      doc.roundedRect(colX, y, colW, maxH, 2, 2, "F");
      doc.setDrawColor(...CARD_SHADOW);
      doc.setLineWidth(0.3);
      doc.roundedRect(colX, y, colW, maxH, 2, 2, "S");

      // Top border accent
      doc.setFillColor(...col.color);
      doc.rect(colX, y, colW, 2, "F");

      // Title
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col.color);
      doc.text(col.label, colX + 4, y + 8);

      // Items
      let iy = y + 13;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT_PRIMARY);
      for (const it of col.items) {
        const lines = doc.splitTextToSize(sanitize(it), colW - 12);
        // Bullet
        doc.setFillColor(...col.color);
        doc.circle(colX + 5, iy - 0.8, 1, "F");
        for (const line of lines) {
          if (iy > y + maxH - 3) break;
          doc.text(line, colX + 8, iy);
          iy += lh;
        }
        iy += 1;
      }
    }
    y += maxH + 6;
  }

  // ═══════════════════════════════════════════
  // ESPELHO RESUMIDO
  // ═══════════════════════════════════════════
  sectionLabel("ESPELHO RESUMIDO", NAVY);
  const mirrorText = sanitize(data.correction.mirror);
  const mirrorLines = doc.splitTextToSize(mirrorText, textMaxW);
  const mirrorH = Math.max(14, mirrorLines.length * lh + 12);
  needPage(Math.min(mirrorH + 4, 60));

  doc.setFillColor(...MIRROR_BG);
  doc.roundedRect(ml, y, cw, mirrorH, 3, 3, "F");
  doc.setDrawColor(...CARD_SHADOW);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, cw, mirrorH, 3, 3, "S");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_PRIMARY);
  let my = y + 7;
  for (const line of mirrorLines) {
    if (my > ph - 18) { doc.addPage(); my = 14; }
    doc.text(line, ml + cardPad, my);
    my += lh;
  }
  y += mirrorH + 6;

  // ═══════════════════════════════════════════
  // RESPOSTA IDEAL
  // ═══════════════════════════════════════════
  sectionLabel("RESPOSTA IDEAL", INDIGO);
  const idealText = sanitize(data.correction.idealAnswer);
  const idealParagraphs = idealText.split(/\n\s*\n|\n/);
  let idealLines: string[] = [];
  for (const p of idealParagraphs) {
    if (!p.trim()) continue;
    idealLines = idealLines.concat(doc.splitTextToSize(p.trim(), textMaxW));
    idealLines.push(""); // spacer
  }
  const idealH = Math.max(14, idealLines.length * lh + 12);
  needPage(Math.min(idealH + 4, 60));

  card(ml, y, cw, idealH);
  doc.setFillColor(...INDIGO);
  doc.rect(ml, y, 2.5, idealH, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_PRIMARY);
  let idy = y + 7;
  for (const line of idealLines) {
    if (idy > ph - 18) { doc.addPage(); idy = 14; }
    if (line === "") { idy += 2; continue; }
    doc.text(line, ml + cardPad + 2, idy);
    idy += lh;
  }
  y += idealH + 6;

  // ═══════════════════════════════════════════
  // LEGIBILIDADE
  // ═══════════════════════════════════════════
  if (data.correction.handwritingNote) {
    sectionLabel("LEGIBILIDADE DA ESCRITA", NAVY);
    needPage(16);

    const levelLabels: Record<string, { text: string; color: [number, number, number] }> = {
      plenamente_legivel: { text: "Plenamente legivel", color: GREEN },
      legivel_com_esforco: { text: "Legivel com esforco", color: AMBER },
      prejudica_parcialmente: { text: "Prejudica parcialmente", color: AMBER },
      compromete_correcao: { text: "Compromete a correcao", color: RED },
    };

    const noteLines = doc.splitTextToSize(sanitize(data.correction.handwritingNote), textMaxW);
    const legH = Math.max(12, noteLines.length * lh + 8);
    card(ml, y, cw, legH);

    // Badge
    const level = data.correction.handwritingLevel ? levelLabels[data.correction.handwritingLevel] : null;
    if (level) {
      const badgeW = doc.getTextWidth(level.text) * 0.6 + 8;
      doc.setFillColor(...level.color);
      doc.roundedRect(ml + 5, y + 3, badgeW, 5, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(level.text, ml + 7, y + 6.5);
    }

    // Note text
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_PRIMARY);
    let ly = y + (level ? 12 : 6);
    for (const line of noteLines) {
      doc.text(line, ml + 6, ly);
      ly += lh;
    }

    y += legH + 6;
  }

  // ═══════════════════════════════════════════
  // FOOTERS
  // ═══════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...CARD_SHADOW);
    doc.setLineWidth(0.3);
    doc.line(ml, ph - 12, pw - mr, ph - 12);
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.setFont("helvetica", "normal");
    doc.text("Salinha de Estudos - Relatorio de Correcao Discursiva", ml, ph - 7);
    doc.text(`Pagina ${i} de ${totalPages}`, pw - mr, ph - 7, { align: "right" });
  }

  // Download
  const qCode = `Q-${String(data.question.publicId).padStart(3, "0")}`;
  const dStr = now.toISOString().slice(0, 10);
  doc.save(`relatorio-correcao-${qCode}-${dStr}.pdf`);
}
