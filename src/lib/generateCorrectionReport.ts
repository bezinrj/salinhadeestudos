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

function esc(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSubmissionLabel(type: string): string {
  if (type === "transcricao") return "Resposta transcrita de imagem/PDF";
  if (type === "correcao_direta") return "Resposta enviada por imagem/PDF (correção direta)";
  return "Resposta digitada manualmente";
}

function getScoreColor(ratio: number): string {
  if (ratio >= 0.75) return "#16a34a";
  if (ratio >= 0.4) return "#d97706";
  return "#dc2626";
}

function getLegibilityBadge(level: string): { label: string; bg: string; color: string } {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    plenamente_legivel: { label: "Legível", bg: "#dcfce7", color: "#065f46" },
    legivel_com_esforco: { label: "Legível com esforço", bg: "#fef3c7", color: "#92400e" },
    prejudica_parcialmente: { label: "Prejudica parcialmente", bg: "#ffedd5", color: "#9a3412" },
    compromete_correcao: { label: "Ilegível", bg: "#fef2f2", color: "#991b1b" },
  };
  return map[level] || { label: level, bg: "#f1f5f9", color: "#475569" };
}

function toBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

export async function generateCorrectionReport(data: ReportData) {
  // Abrir a janela ANTES de qualquer await — caso contrário o navegador
  // bloqueia o popup (fora do gesto do usuário) e o PDF sai em branco.
  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Gerando relatório...</title></head><body style="font-family:system-ui;padding:40px;text-align:center;color:#475569;">Gerando relatório…</body></html>'
    );
  }

  const logoBase64 = await toBase64(logoImg);
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`;
  const grade = data.correction.grade;
  const maxGrade = data.correction.maxGrade;
  const pct = Math.min(100, (grade / maxGrade) * 100);
  const circumference = 2 * Math.PI * 34; // ~213.6
  const offset = circumference - (circumference * pct) / 100;
  const qCode = `Q-${String(data.question.publicId).padStart(3, "0")}`;

  const answerText = data.answerText || data.correction.answer || "[Sem resposta disponível]";

  // Build criteria HTML
  let criteriaHTML = "";
  if (data.correction.baremaBreakdown && data.correction.baremaBreakdown.length > 0) {
    for (const item of data.correction.baremaBreakdown) {
      const ratio = item.maxScore > 0 ? item.earnedScore / item.maxScore : 0;
      const color = getScoreColor(ratio);
      const barPct = Math.min(100, ratio * 100);

      let subitemsHTML = "";
      for (const sub of item.subitems) {
        const isOk = sub.status === "full";
        const isPartial = sub.status === "partial";
        const icon = isOk ? "✓" : "✗";
        const iconColor = isOk ? "#16a34a" : isPartial ? "#d97706" : "#dc2626";
        const bg = isOk ? "#f0fdf4" : "#fef2f2";
        const scoreColor = isOk ? "#16a34a" : isPartial ? "#d97706" : "#dc2626";
        subitemsHTML += `
          <div style="display:flex;align-items:center;gap:8px;background:${bg};border-radius:8px;padding:8px 10px;margin-bottom:5px;">
            <span style="font-size:13px;font-weight:700;color:${iconColor};flex-shrink:0;width:18px;text-align:center;">${icon}</span>
            <span style="flex:1;font-size:12px;color:#374151;line-height:1.5;">${esc(sub.description)}</span>
            <span style="font-size:11px;font-weight:600;color:${scoreColor};flex-shrink:0;">${sub.earnedScore.toFixed(1)}/${sub.maxScore.toFixed(1)}</span>
          </div>`;
      }

      criteriaHTML += `
        <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:600;color:#1e2a4a;">${esc(item.letter + ") " + item.title)}</span>
            <span style="font-size:13px;font-weight:700;color:${color};">${item.earnedScore.toFixed(1)} / ${item.maxScore.toFixed(1)}</span>
          </div>
          <div style="height:5px;background:#f1f5f9;border-radius:99px;margin:10px 0;overflow:hidden;">
            <div class="progress-bar" style="height:100%;width:0%;background:${color};border-radius:99px;transition:width 0.9s ease-out;" data-width="${barPct}%"></div>
          </div>
          ${subitemsHTML}
        </div>`;
    }
  }

  // Build bullet lists
  const buildList = (items: string[], bulletChar: string, bulletColor: string) =>
    items.map(t => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
      <span style="color:${bulletColor};font-size:14px;line-height:1;margin-top:2px;">${bulletChar}</span>
      <span style="font-size:12px;color:#374151;line-height:1.6;">${esc(t)}</span>
    </div>`).join("");

  const hasPositives = data.correction.positives.length > 0 && data.correction.positives[0] !== "Nenhum ponto do espelho foi adequadamente abordado.";
  const hasErrors = data.correction.errors.length > 0;
  const hasOmissions = data.correction.omissions.length > 0;

  // Legibility section
  let legibilityHTML = "";
  if (data.correction.handwritingNote) {
    const badge = getLegibilityBadge(data.correction.handwritingLevel || "");
    legibilityHTML = `
      <div style="border:0.5px solid #e2e8f0;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-top:20px;">
        <span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;background:${badge.bg};color:${badge.color};">${esc(badge.label)}</span>
        <span style="font-size:12px;color:#475569;line-height:1.6;">${esc(data.correction.handwritingNote)}</span>
      </div>`;
  }

  // Paragraphize text
  const paragraphize = (text: string) =>
    esc(text).split(/\n\s*\n|\n/).filter(p => p.trim()).map(p => `<p style="margin:0 0 10px 0;">${p.trim()}</p>`).join("");

  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" style="height:48px;width:auto;object-fit:contain;" />`
    : `<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="22" fill="#2d3f6a"/><text x="24" y="30" text-anchor="middle" fill="#c8d6f0" font-size="20" font-weight="bold">⚖</text></svg>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório de Correção - ${qCode}</title>
<style>
  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: #f8f9fc; color: #1e2a4a; line-height: 1.5; }
  .container { max-width: 800px; margin: 0 auto; padding: 0; }
  
  .header { background: #1e2a4a; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
  .header-left { display: flex; flex-direction: column; gap: 6px; }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .header-brand span { font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.1em; text-transform: uppercase; }
  .header-title { font-size: 22px; font-weight: 700; color: #fff; }
  .header-date { font-size: 12px; color: #93a8d4; }
  
  .grade-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .grade-ring svg { display: block; }
  .grade-label { font-size: 11px; color: #93a8d4; }
  
  .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 24px; }
  .id-card { border: 0.5px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 12px 14px; }
  .id-card-label { font-size: 11px; font-weight: 600; color: #6366f1; text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .id-card-label svg { width: 16px; height: 16px; flex-shrink: 0; }
  .id-card-value { font-size: 15px; font-weight: 700; color: #1e2a4a; }
  
  .section { padding: 0 24px; margin-top: 20px; }
  .section-label { font-size: 11px; text-transform: uppercase; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 12px; }
  
  .accordion { border: 0.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; user-select: none; background: #fff; }
  .accordion-header span { font-size: 14px; font-weight: 700; color: #1e2a4a; }
  .accordion-arrow { font-size: 14px; color: #94a3b8; transition: transform 0.3s ease; }
  .accordion-body { max-height: 2000px; overflow: hidden; transition: max-height 0.3s ease; padding: 0 16px 16px 16px; }
  .accordion-body.closed { max-height: 0; padding-bottom: 0; }
  .accordion-text { font-size: 13px; line-height: 1.8; color: #374151; border-left: 3px solid #6366f1; padding-left: 14px; }
  
  .feedback-card { background: #fffbeb; border: 0.5px solid #fbbf24; border-radius: 12px; padding: 16px; }
  .feedback-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .feedback-header svg { width: 16px; height: 16px; }
  .feedback-header span { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; }
  .feedback-text { font-size: 13px; font-style: italic; color: #78350f; line-height: 1.75; }
  
  .trio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .trio-card { border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #fff; }
  .trio-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 0.5px solid #e2e8f0; }
  .trio-card-header span { font-size: 11px; font-weight: 700; text-transform: uppercase; }
  
  .mirror-card { background: #f8fafc; border-radius: 12px; padding: 16px; }
  .mirror-text { font-size: 13px; line-height: 1.8; color: #475569; }
  
  .ideal-card { border: 1px solid #6366f1; border-radius: 12px; overflow: hidden; }
  .ideal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; background: #fff; }
  .ideal-header span { font-size: 14px; font-weight: 600; color: #6366f1; }
 .ideal-body { max-height: none; overflow: visible; padding: 0 16px 16px 16px; }
 .ideal-body.closed { max-height: 0; overflow: hidden; padding-bottom: 0; }
 @media print { .accordion-body, .ideal-body { max-height: none !important; overflow: visible !important; padding: 0 16px 16px 16px !important; } }
  .ideal-text { font-size: 13px; line-height: 1.8; color: #374151; }
  
  .answer-section { border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #fff; }
  .answer-meta { font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
  .answer-meta strong { color: #6366f1; font-weight: 600; }
  .answer-text { font-size: 13px; line-height: 1.8; color: #374151; background: #f8fafc; border-radius: 8px; padding: 14px; border: 0.5px solid #e2e8f0; white-space: pre-wrap; word-break: break-word; }
  
  .footer { text-align: center; padding: 20px 24px; border-top: 0.5px solid #e2e8f0; margin-top: 24px; }
  .footer span { font-size: 10px; color: #94a3b8; }
  
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e2a4a; color: #fff; border: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 999; }
  .print-btn:hover { background: #2d3f6a; }
  
  @media (max-width: 768px) {
    .cards-grid, .trio-grid { grid-template-columns: 1fr; }
    .header { padding: 16px; flex-direction: column; gap: 16px; align-items: flex-start; }
    .grade-ring { align-self: center; }
    .section { padding: 0 12px; }
    .cards-grid { padding: 12px; }
  }
</style>
</head>
<body>
<div class="container">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="header-brand">
        ${logoHTML}
        <span>SALINHA DE ESTUDOS</span>
      </div>
      <div class="header-title">Relatório de Correção Discursiva</div>
      <div class="header-date">Gerado em ${esc(dateStr)}</div>
    </div>
    <div class="grade-ring">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#2d3f6a" stroke-width="7"/>
        <circle cx="40" cy="40" r="34" fill="none" stroke="#20c997" stroke-width="7" stroke-linecap="round"
          stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${circumference.toFixed(1)}"
          transform="rotate(-90 40 40)" class="grade-arc" data-target="${offset.toFixed(1)}"/>
        <text x="40" y="40" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="24" font-weight="700">${grade.toFixed(1)}</text>
        <text x="40" y="56" text-anchor="middle" fill="#93a8d4" font-size="11">/${maxGrade}</text>
      </svg>
      <span class="grade-label">nota final</span>
    </div>
  </div>

  <!-- ID CARDS -->
  <div class="cards-grid">
    <div class="id-card">
      <div class="id-card-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        ID QUESTÃO
      </div>
      <div class="id-card-value">${esc(qCode)}</div>
    </div>
    <div class="id-card">
      <div class="id-card-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        CARGO
      </div>
      <div class="id-card-value">${esc(data.question.career)}</div>
    </div>
    <div class="id-card">
      <div class="id-card-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        MATÉRIA
      </div>
      <div class="id-card-value">${esc(data.question.discipline)}</div>
    </div>
  </div>

  <!-- ENUNCIADO -->
  <div class="section">
    <div class="accordion" id="acc-enunciado">
      <div class="accordion-header" onclick="toggleAcc('acc-enunciado')">
        <span>📝 Enunciado da questão</span>
        <span class="accordion-arrow">▾</span>
      </div>
      <div class="accordion-body">
        <div class="accordion-text">${paragraphize(data.question.statement)}</div>
      </div>
    </div>
  </div>

  <!-- RESPOSTA DO ALUNO -->
  <div class="section">
    <div class="section-label">RESPOSTA DO ALUNO</div>
    <div class="answer-section">
      <div class="answer-meta">
        <strong>Tipo de envio:</strong> ${esc(getSubmissionLabel(data.submissionType))}
        ${data.uploadedFileName ? `<br/><strong>Arquivo:</strong> ${esc(data.uploadedFileName)}` : ""}
      </div>
      <div class="answer-text">${esc(answerText)}</div>
    </div>
  </div>

  <!-- FEEDBACK GERAL -->
  <div class="section">
    <div class="feedback-card">
      <div class="feedback-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1h-6a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
        <span>FEEDBACK GERAL</span>
      </div>
      <div class="feedback-text">${paragraphize(data.correction.feedback)}</div>
    </div>
  </div>

  ${data.correction.maxScoreFeedback ? `
  <!-- FEEDBACK PARA NOTA MÁXIMA -->
  <div class="section">
    <div class="feedback-card" style="background:#fffbeb;border-color:#f59e0b;">
      <div class="feedback-header">
        <span style="color:#92400e;">🏆 FEEDBACK PARA ALCANÇAR A NOTA MÁXIMA</span>
      </div>
      <div style="font-size:12px;color:#451a03;line-height:1.7;">
        <p style="margin:8px 0 4px;font-weight:700;text-transform:uppercase;font-size:10px;color:#92400e;">1. Tese central</p>
        <div>${paragraphize(data.correction.maxScoreFeedback.thesisAssessment)}</div>

        ${data.correction.maxScoreFeedback.pointsLost?.length ? `
        <p style="margin:12px 0 4px;font-weight:700;text-transform:uppercase;font-size:10px;color:#92400e;">2. Pontos que fizeram perder nota</p>
        <ul style="margin:4px 0 0 18px;padding:0;">${data.correction.maxScoreFeedback.pointsLost.map((p: string) => `<li style="margin-bottom:4px;">${esc(p)}</li>`).join("")}</ul>
        ` : ""}

        <p style="margin:12px 0 4px;font-weight:700;text-transform:uppercase;font-size:10px;color:#92400e;">3. O que deveria ter sido escrito</p>
        <div>${paragraphize(data.correction.maxScoreFeedback.whatShouldHaveBeenWritten)}</div>

        <p style="margin:12px 0 4px;font-weight:700;text-transform:uppercase;font-size:10px;color:#92400e;">4. Como melhorar na próxima</p>
        <div>${paragraphize(data.correction.maxScoreFeedback.howToImprove)}</div>

        <p style="margin:12px 0 4px;font-weight:700;text-transform:uppercase;font-size:10px;color:#92400e;">5. Frase-modelo</p>
        <div style="border-left:3px solid #f59e0b;padding:6px 10px;background:#fef3c7;font-style:italic;">"${esc(data.correction.maxScoreFeedback.modelSentence)}"</div>
      </div>
    </div>
  </div>
  ` : ""}

  <!-- ANÁLISE POR CRITÉRIO -->
  ${criteriaHTML ? `
  <div class="section">
    <div class="section-label">ANÁLISE POR CRITÉRIO</div>
    ${criteriaHTML}
  </div>` : ""}

  <!-- PONTOS / ERROS / OMISSÕES -->
  ${(hasPositives || hasErrors || hasOmissions) ? `
  <div class="section">
    <div class="trio-grid">
      ${hasPositives ? `
      <div class="trio-card" style="border-top:3px solid #10b981;">
        <div class="trio-card-header">
          <span style="color:#065f46;">✓ PONTOS POSITIVOS</span>
        </div>
        ${buildList(data.correction.positives, "●", "#10b981")}
      </div>` : ""}
      ${hasErrors ? `
      <div class="trio-card" style="border-top:3px solid #ef4444;">
        <div class="trio-card-header">
          <span style="color:#991b1b;">✗ ERROS</span>
        </div>
        ${buildList(data.correction.errors, "■", "#ef4444")}
      </div>` : ""}
      ${hasOmissions ? `
      <div class="trio-card" style="border-top:3px solid #f59e0b;">
        <div class="trio-card-header">
          <span style="color:#92400e;">○ OMISSÕES</span>
        </div>
        ${buildList(data.correction.omissions, "●", "#f59e0b")}
      </div>` : ""}
    </div>
  </div>` : ""}

  <!-- ESPELHO RESUMIDO -->
  <div class="section">
    <div class="mirror-card">
      <div class="section-label">ESPELHO RESUMIDO</div>
      <div class="mirror-text">${paragraphize(data.correction.mirror)}</div>
    </div>
  </div>

  <!-- RESPOSTA IDEAL -->
  <div class="section">
    <div class="ideal-card" id="acc-ideal">
      <div class="ideal-header" onclick="toggleIdeal()">
        <span>💡 Resposta ideal</span>
        <span class="accordion-arrow" id="ideal-arrow">▾</span>
      </div>
      <div class="ideal-body" id="ideal-body">
        <div class="ideal-text">${paragraphize(data.correction.idealAnswer)}</div>
      </div>
    </div>
  </div>

  <!-- LEGIBILIDADE -->
  ${legibilityHTML ? `<div class="section">${legibilityHTML}</div>` : ""}

  <!-- FOOTER -->
  <div class="footer">
    <span>Salinha de Estudos — Relatório de Correção Discursiva — ${esc(dateStr)}</span>
  </div>

</div>

<button class="print-btn no-print" onclick="window.print()">📄 Salvar como PDF</button>

<script>
  // Animate progress bars
  setTimeout(function() {
    var bars = document.querySelectorAll('.progress-bar');
    bars.forEach(function(b) { b.style.width = b.getAttribute('data-width'); });
  }, 200);

  // Animate grade arc
  setTimeout(function() {
    var arc = document.querySelector('.grade-arc');
    if (arc) {
      arc.style.transition = 'stroke-dashoffset 1.2s ease-out';
      arc.style.strokeDashoffset = arc.getAttribute('data-target');
    }
  }, 100);

  // Accordion toggles
  function toggleAcc(id) {
    var el = document.getElementById(id);
    var body = el.querySelector('.accordion-body');
    var arrow = el.querySelector('.accordion-arrow');
    body.classList.toggle('closed');
    arrow.textContent = body.classList.contains('closed') ? '▸' : '▾';
  }
  function toggleIdeal() {
    var body = document.getElementById('ideal-body');
    var arrow = document.getElementById('ideal-arrow');
    body.classList.toggle('open');
    arrow.textContent = body.classList.contains('open') ? '▾' : '▸';
  }
</script>
</body>
</html>`;

  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // Também dispara o download automático em PDF
  try {
    // @ts-ignore - biblioteca sem tipos
    const html2pdf = (await import("html2pdf.js")).default;
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-99999px;top:0;width:820px;height:1200px;border:0;";
    document.body.appendChild(iframe);
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    // aguarda animações e imagens
    await new Promise((r) => setTimeout(r, 400));
    const target = iframe.contentDocument?.querySelector(".container") as HTMLElement | null;
    if (target) {
      await html2pdf()
        .from(target)
        .set({
          filename: `Relatorio-${qCode}.pdf`,
          margin: 0,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          // @ts-ignore
          pagebreak: { mode: ["css", "legacy"] },
        })
        .save();
    }
    iframe.remove();
  } catch (err) {
    console.error("Falha ao gerar PDF automático:", err);
  }
}
